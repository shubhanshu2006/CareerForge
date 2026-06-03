import { prisma } from "../config/prisma.js";
import type { ExperienceLevel, EmploymentType, Prisma } from "../../generated/prisma/index.js";

export type JobFilters = {
  title?: string;
  company?: string;
  location?: string;
  employmentType?: EmploymentType;
  workType?: "REMOTE" | "ONSITE" | "HYBRID";
  remote?: boolean;
  experience?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  query?: string;
};

export type JobSort = "latest" | "salary" | "relevance";

export const findJobById = async (id: number, userId?: number) => {
  const job = await prisma.job.findUnique({
    where: { id },
    include: userId
      ? {
          jobAlerts: { where: { userId }, select: { id: true } },
          applications: {
            where: { userId },
            select: { id: true, status: true },
          },
        }
      : undefined,
  });
  if (!job) return null;

  // Flatten application info onto the job object
  const application = userId && "applications" in job
    ? (job.applications as Array<{ id: number; status: string }>)[0] ?? null
    : null;

  // Strip the includes from the returned object and add flat fields
  const { applications: _a, jobAlerts: _j, ...rest } = job as typeof job & {
    applications?: Array<{ id: number; status: string }>;
    jobAlerts?: unknown[];
  };
  void _a; void _j;

  return {
    ...rest,
    applicationId: application?.id ?? null,
    applicationStatus: application?.status ?? null,
  };
};

export const getJobTypeCounts = async () => {
  const [all, fullTime, internship] = await Promise.all([
    prisma.job.count({ where: { isActive: true } }),
    prisma.job.count({
      where: {
        isActive: true,
        OR: [
          { employmentType: "FULL_TIME" },
          {
            employmentType: null,
            AND: [
              { NOT: { title: { contains: "intern", mode: "insensitive" } } },
            ],
          },
        ],
      },
    }),
    prisma.job.count({
      where: {
        isActive: true,
        OR: [
          { employmentType: "INTERNSHIP" },
          { title: { contains: "intern", mode: "insensitive" } },
        ],
      },
    }),
  ]);

  return { all, fullTime, internship };
};

export const findJobs = async (input: {
  filters: JobFilters;
  sort: JobSort;
  skip: number;
  take: number;
  userId?: number;
}) => {
  const { filters } = input;
  const where: Prisma.JobWhereInput = {
    isActive: true,
  };
  const andConditions = (
    current: Prisma.JobWhereInput["AND"],
    condition: Prisma.JobWhereInput,
  ): Prisma.JobWhereInput[] => {
    if (!current) return [condition];
    return Array.isArray(current) ? [...current, condition] : [current, condition];
  };

  if (filters.title) {
    where.title = { contains: filters.title, mode: "insensitive" };
  }
  if (filters.company) {
    where.company = {
      contains: filters.company,
      mode: "insensitive",
    };
  }
  if (filters.location) {
    where.location = {
      contains: filters.location,
      mode: "insensitive",
    };
  }
  if (filters.employmentType) {
    const employmentNeedle = filters.employmentType.toLowerCase().replace(/_/g, " ");
    const hyphenNeedle = employmentNeedle.replace(/ /g, "-");
    const keywordMap: Record<string, string[]> = {
      FULL_TIME: ["full time", "full-time", "permanent", "regular"],
      PART_TIME: ["part time", "part-time"],
      CONTRACT: ["contract", "temporary", "temp", "freelance"],
      INTERNSHIP: ["intern", "internship", "trainee"],
      TEMPORARY: ["temporary", "temp"],
      FREELANCE: ["freelance", "contract"],
    };
    const keywords = keywordMap[filters.employmentType] ?? [employmentNeedle, hyphenNeedle];
    const keywordOr = keywords.flatMap((keyword) => [
      { description: { contains: keyword, mode: "insensitive" as const } },
      { title: { contains: keyword, mode: "insensitive" as const } },
    ]);

    if (filters.employmentType === "FULL_TIME") {
      where.AND = andConditions(where.AND, {
        OR: [
          { employmentType: filters.employmentType },
          ...keywordOr,
          {
            NOT: {
              OR: [
                { title: { contains: "intern", mode: "insensitive" } },
                { description: { contains: "intern", mode: "insensitive" } },
                { title: { contains: "part-time", mode: "insensitive" } },
                { description: { contains: "part-time", mode: "insensitive" } },
                { title: { contains: "contract", mode: "insensitive" } },
                { description: { contains: "contract", mode: "insensitive" } },
                { title: { contains: "freelance", mode: "insensitive" } },
                { description: { contains: "freelance", mode: "insensitive" } },
              ],
            },
          },
        ],
      });
    } else {
      where.AND = andConditions(where.AND, {
        OR: [{ employmentType: filters.employmentType }, ...keywordOr],
      });
    }
  }
  if (filters.remote !== undefined) {
    where.isRemote = filters.remote;
  }
  if (filters.workType) {
    if (filters.workType === "REMOTE") {
      where.isRemote = true;
    } else if (filters.workType === "ONSITE") {
      where.isRemote = false;
      where.AND = andConditions(where.AND, {
        OR: [
          { location: null },
          { NOT: { location: { contains: "hybrid", mode: "insensitive" } } },
        ],
      });
    } else if (filters.workType === "HYBRID") {
      where.isRemote = false;
      where.AND = andConditions(where.AND, {
        OR: [
          { location: { contains: "hybrid", mode: "insensitive" } },
          { description: { contains: "hybrid", mode: "insensitive" } },
        ],
      });
    }
  }
  if (filters.experience) {
    where.experienceLevel = filters.experience;
  }
  if (filters.salaryMin !== undefined) {
    where.maxSalary = { gte: filters.salaryMin };
  }
  if (filters.salaryMax !== undefined) {
    where.minSalary = { lte: filters.salaryMax };
  }
  if (filters.query) {
    const normalizedQuery = filters.query.trim();
    // Split into individual words so "Backend Developer" matches
    // "Senior Backend Engineer" and "Node.js Developer" separately
    const words = normalizedQuery.split(/\s+/).filter((w) => w.length > 1);
    const termConditions = words.flatMap((word) => [
      { title: { contains: word, mode: "insensitive" as const } },
      { company: { contains: word, mode: "insensitive" as const } },
      { description: { contains: word, mode: "insensitive" as const } },
      { department: { contains: word, mode: "insensitive" as const } },
    ]);
    where.AND = andConditions(where.AND, { OR: termConditions });
  }

  // 3-month staleness filter — never show jobs older than 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  where.AND = andConditions(where.AND, {
    OR: [
      { postedAt: { gte: cutoff } },
      { postedAt: null, createdAt: { gte: cutoff } },
    ],
  });

  const orderBy = (() => {
    switch (input.sort) {
      case "salary":
        return [{ maxSalary: "desc" as const }, { minSalary: "desc" as const }];
      case "relevance":
        return [{ postedAt: "desc" as const }, { createdAt: "desc" as const }];
      case "latest":
      default:
        return [{ postedAt: "desc" as const }, { createdAt: "desc" as const }];
    }
  })();

  const [total, rawItems] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy,
      skip: input.skip,
      take: input.take,
      include: input.userId
        ? {
            applications: {
              where: { userId: input.userId },
              select: { id: true, status: true },
            },
          }
        : undefined,
    }),
  ]);

  // Flatten application info onto each job
  const items = rawItems.map((job) => {
    const application = input.userId && "applications" in job
      ? (job.applications as Array<{ id: number; status: string }>)[0] ?? null
      : null;
    const { applications: _a, ...rest } = job as typeof job & {
      applications?: Array<{ id: number; status: string }>;
    };
    void _a;
    return {
      ...rest,
      applicationId: application?.id ?? null,
      applicationStatus: application?.status ?? null,
    };
  });

  return { total, items };
};

// ─── Additional Methods (Step 8) ─────────────────────────────────────────────

/**
 * Find a job by its source platform identifier (source + sourceJobId).
 * Used by the deduplication pipeline to detect exact duplicates.
 */
export const findJobBySourceJobId = (input: {
  source: string;
  sourceJobId: string;
}) =>
  prisma.job.findFirst({
    where: {
      source: input.source as never,
      sourceJobId: input.sourceJobId,
    },
    select: { id: true, dedupeKey: true },
  });

/**
 * Batch-create jobs using Prisma's createMany with duplicate skipping.
 * Returns the count of actually created records.
 *
 * Note: createMany does not trigger Prisma middleware / hooks, so the caller
 * is responsible for firing job-alert logic separately.
 */
export const createManyJobs = async (
  inputs: Array<{
    source: string;
    sourceJobId?: string | null;
    dedupeKey: string;
    company: string;
    companyLogo?: string | null;
    title: string;
    location?: string | null;
    department?: string | null;
    employmentType?: string | null;
    description?: string | null;
    applyUrl: string;
    postedAt?: Date | null;
    isRemote: boolean;
    experienceLevel?: string | null;
    minSalary?: number;
    maxSalary?: number;
    externalId?: string | null;
  }>,
) => {
  if (inputs.length === 0) return { count: 0 };
  return prisma.job.createMany({
    data: inputs.map((i) => ({
      source: i.source as never,
      sourceJobId: i.sourceJobId ?? null,
      dedupeKey: i.dedupeKey,
      company: i.company,
      companyLogo: i.companyLogo ?? null,
      title: i.title,
      location: i.location ?? null,
      department: i.department ?? null,
      employmentType: (i.employmentType as never) ?? null,
      description: i.description ?? null,
      applyUrl: i.applyUrl,
      postedAt: i.postedAt ?? null,
      isRemote: i.isRemote,
      experienceLevel: (i.experienceLevel as never) ?? null,
      minSalary: i.minSalary ?? 0,
      maxSalary: i.maxSalary ?? 0,
      externalId: i.externalId ?? null,
    })),
    skipDuplicates: true,
  });
};

/**
 * Update specific fields on a single job.
 */
export const updateJob = (
  id: number,
  data: Partial<{
    title: string;
    location: string | null;
    description: string | null;
    isRemote: boolean;
    isActive: boolean;
    applyUrl: string;
    minSalary: number;
    maxSalary: number;
  }>,
) =>
  prisma.job.update({
    where: { id },
    data,
  });

/**
 * Soft-delete a single job by marking it inactive.
 */
export const deactivateJob = (id: number) =>
  prisma.job.update({
    where: { id },
    data: { isActive: false },
  });

/**
 * Bulk soft-delete multiple jobs by ID (e.g. removed/expired postings).
 */
export const deactivateStaledJobs = (ids: number[]) => {
  if (ids.length === 0) return Promise.resolve({ count: 0 });
  return prisma.job.updateMany({
    where: { id: { in: ids } },
    data: { isActive: false },
  });
};
