import { prisma } from "../config/prisma.js";
import type {
  EmploymentType,
  ExperienceLevel,
  Source,
} from "../../generated/prisma/index.js";

export type NormalizedJobInput = {
  source: Source;
  company: string;
  title: string;
  dedupeKey: string;
  location: string | null;
  department?: string | null;
  employmentType?: EmploymentType | null;
  description?: string | null;
  applyUrl: string;
  postedAt?: Date | null;
  isRemote: boolean;
  experienceLevel?: ExperienceLevel | null;
  minSalary?: number;
  maxSalary?: number;
  externalId?: string | null;
  companyLogo?: string | null;
};

export const findJobByDedupe = async (input: { dedupeKey: string }) =>
  prisma.job.findFirst({
    where: {
      dedupeKey: input.dedupeKey,
    },
  });

export const createJob = async (input: NormalizedJobInput) =>
  prisma.job.create({
    data: {
      source: input.source,
      company: input.company,
      companyLogo: input.companyLogo ?? null,
      title: input.title,
      dedupeKey: input.dedupeKey,
      location: input.location,
      department: input.department ?? null,
      employmentType: input.employmentType ?? null,
      description: input.description ?? null,
      applyUrl: input.applyUrl,
      postedAt: input.postedAt ?? null,
      isRemote: input.isRemote,
      experienceLevel: input.experienceLevel ?? null,
      minSalary: input.minSalary ?? 0,
      maxSalary: input.maxSalary ?? 0,
      externalId: input.externalId ?? null,
    },
  });
