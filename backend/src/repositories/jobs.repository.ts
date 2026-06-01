import { prisma } from "../config/prisma.js";
import type { ExperienceLevel } from "../../generated/prisma/index.js";

export type JobFilters = {
  title?: string;
  company?: string;
  location?: string;
  remote?: boolean;
  experience?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  query?: string;
};

export type JobSort = "latest" | "salary" | "relevance";

export const findJobById = (id: number) =>
  prisma.job.findUnique({
    where: { id },
  });

export const findJobs = async (input: {
  filters: JobFilters;
  sort: JobSort;
  skip: number;
  take: number;
}) => {
  const { filters } = input;
  const where: Record<string, unknown> = {
    isActive: true,
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
  if (filters.remote !== undefined) {
    where.isRemote = filters.remote;
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
    where.OR = [
      {
        title: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        company: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
    ];
  }

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

  const [total, items] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy,
      skip: input.skip,
      take: input.take,
    }),
  ]);

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
