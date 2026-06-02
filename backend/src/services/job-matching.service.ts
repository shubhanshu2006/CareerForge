/**
 * Job Matching Service.
 *
 * Whenever a new job is inserted into the database, this service finds all
 * users whose preferences match the job and creates the necessary alert records.
 *
 * Match criteria (any one match triggers an alert):
 *   - User has the company in their preferred companies list
 *   - User has a preferred title that appears in the job title (case-insensitive)
 *   - User has a preferred skill that appears in the job description (in-memory)
 *   - User's preferred location matches the job location
 *   - User prefers remote work and the job is remote
 *
 * Skill matching is handled as a SEPARATE additive pass (not a filter on top of
 * other matches) to avoid false negatives: a user who matched on company/title/
 * location should never be excluded because of their skill preferences.
 *
 * This service is invoked by the job ingestion service after each new job
 * is created, not in bulk — to ensure every new job is promptly matched.
 */

import { prisma } from "../config/prisma.js";
import { emailQueue } from "../queues/index.js";

export interface JobMatchInput {
  jobId: number;
  company: string;
  title: string;
  location?: string | null;
  isRemote: boolean;
  description?: string | null;
}

const userSelect = {
  id: true,
  email: true,
  jobPreferences: {
    select: {
      emailEnabled: true,
      titles: { select: { title: true } },
      skills: { select: { skill: true } },
    },
  },
};

type MatchedUser = {
  id: number;
  email: string | null;
  jobPreferences: {
    emailEnabled: boolean;
    titles: { title: string }[];
    skills: { skill: string }[];
  } | null;
};

/**
 * Find users who match on company, title, location, or remote criteria.
 */
const findNonSkillCandidates = async (
  input: JobMatchInput,
): Promise<MatchedUser[]> =>
  prisma.user.findMany({
    where: {
      email: { not: null },
      accountEnabled: true,
      accountLocked: false,
      emailVerified: true,
      AND: [
        {
          OR: [
            { jobPreferences: { is: { emailEnabled: true } } },
            { jobPreferences: { is: null } },
          ],
        },
        {
          OR: [
            // Preferred company match
            {
              preferredCompanies: {
                some: {
                  companyName: { equals: input.company, mode: "insensitive" },
                },
              },
            },
            // Location preference match
            {
              profile: {
                is: {
                  locations: {
                    some: {
                      location: {
                        contains: input.location ?? "",
                        mode: "insensitive",
                      },
                    },
                  },
                },
              },
            },
            // Remote work type match
            ...(input.isRemote
              ? [
                  {
                    profile: {
                      is: {
                        workTypes: {
                          some: { workType: "REMOTE" as const },
                        },
                      },
                    },
                  },
                ]
              : []),
          ],
        },
      ],
    },
    select: userSelect,
  }) as Promise<MatchedUser[]>;

/**
 * Find users who should be alerted based on skill matching.
 *
 * Steps:
 *   1. Fetch all active/verified users who have at least one skill preference.
 *   2. Filter in-memory: the user's skill must appear in the job description.
 *
 * This runs as a SEPARATE additive pass so users matched here are ADDED to the
 * alert set rather than used to filter users already matched by other criteria.
 */
const findSkillMatchedUsers = async (
  descriptionLower: string,
): Promise<MatchedUser[]> => {
  const usersWithSkills = (await prisma.user.findMany({
    where: {
      email: { not: null },
      accountEnabled: true,
      accountLocked: false,
      emailVerified: true,
      AND: [
        {
          OR: [
            { jobPreferences: { is: { emailEnabled: true } } },
            { jobPreferences: { is: null } },
          ],
        },
        // Must have at least one saved skill preference
        { jobPreferences: { is: { skills: { some: {} } } } },
      ],
    },
    select: userSelect,
  })) as MatchedUser[];

  // In-memory filter: at least one of the user's skills appears in the description
  return usersWithSkills.filter((u) =>
    u.jobPreferences?.skills?.some((s) =>
      descriptionLower.includes(s.skill.toLowerCase()),
    ),
  );
};

const findTitleMatchedUsers = async (
  jobTitleLower: string,
): Promise<MatchedUser[]> => {
  const usersWithTitles = (await prisma.user.findMany({
    where: {
      email: { not: null },
      accountEnabled: true,
      accountLocked: false,
      emailVerified: true,
      AND: [
        {
          OR: [
            { jobPreferences: { is: { emailEnabled: true } } },
            { jobPreferences: { is: null } },
          ],
        },
        { jobPreferences: { is: { titles: { some: {} } } } },
      ],
    },
    select: userSelect,
  })) as MatchedUser[];

  return usersWithTitles.filter((u) =>
    u.jobPreferences?.titles?.some((t) =>
      jobTitleLower.includes(t.title.toLowerCase()),
    ),
  );
};

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Match a newly inserted job against all user preferences and dispatch alerts.
 *
 * Called by `jobIngestion.service.ts` after each new job is created.
 * Creates JobAlert records, Notification records, and enqueues email jobs.
 */
export const matchJobToUsers = async (
  input: JobMatchInput,
): Promise<{ notified: number }> => {
  const descLower = (input.description ?? "").toLowerCase();
  const titleLower = input.title.toLowerCase();

  // Run both query passes concurrently
  const [nonSkillCandidates, titleCandidates, skillCandidates] =
    await Promise.all([
    findNonSkillCandidates(input),
    titleLower.length > 0
      ? findTitleMatchedUsers(titleLower)
      : Promise.resolve<MatchedUser[]>([]),
    descLower.length > 0
      ? findSkillMatchedUsers(descLower)
      : Promise.resolve<MatchedUser[]>([]),
    ]);

  // Union both sets by user ID — no user should receive duplicate alerts
  const allById = new Map<number, MatchedUser>(
    nonSkillCandidates.map((u) => [u.id, u]),
  );
  for (const u of titleCandidates) {
    if (!allById.has(u.id)) allById.set(u.id, u);
  }
  for (const u of skillCandidates) {
    if (!allById.has(u.id)) allById.set(u.id, u);
  }

  const matched = [...allById.values()];
  if (matched.length === 0) return { notified: 0 };

  const userIds = matched.map((u) => u.id);

  // Create JobAlert records (skipDuplicates prevents double-alerting)
  await prisma.jobAlert.createMany({
    data: userIds.map((userId) => ({ userId, jobId: input.jobId })),
    skipDuplicates: true,
  });

  // Create in-app Notification records
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: `New role at ${input.company}`,
      message: `${input.title} was just posted${input.location ? ` · ${input.location}` : ""}.`,
      type: "JOB_ALERT" as const,
    })),
  });

  // Enqueue email jobs (slight delay to let DB writes settle before email goes out)
  await Promise.all(
    userIds.map((userId) =>
      emailQueue.add(
        "jobAlert",
        { userId, jobId: input.jobId },
        {
          delay: 2_000,
          removeOnComplete: true,
          removeOnFail: { count: 5 },
        },
      ),
    ),
  );

  console.log(
    `[Matching] Job #${input.jobId} "${input.title}" matched ${matched.length} user(s) ` +
      `(${nonSkillCandidates.length} base, ${titleCandidates.length} title, ${skillCandidates.length} skill)`,
  );

  return { notified: matched.length };
};
