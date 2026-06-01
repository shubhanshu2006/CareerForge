import { createHash } from "crypto";
import type {
  EmploymentType,
  ExperienceLevel,
  Source,
} from "../../generated/prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import {
  createJob,
  findJobByDedupe,
  NormalizedJobInput,
} from "../repositories/jobIngestion.repository.js";
import { matchJobToUsers } from "./job-matching.service.js";

export type RawJobInput = {
  source: Source;
  company: string;
  title: string;
  location?: string | null;
  department?: string | null;
  employmentType?: EmploymentType | null;
  description?: string | null;
  applyUrl: string;
  postedAt?: string | Date | null;
  isRemote?: boolean | null;
  experienceLevel?: ExperienceLevel | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  externalId?: string | null;
  companyLogo?: string | null;
};

type IngestionResult = {
  received: number;
  created: number;
  skipped: number;
  errors: Array<{ index: number; reason: string }>;
  alertsGenerated: number;
  emailsEnqueued: number;
};

const normalizeText = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Deterministic SHA-256 dedupe key — mirrors generateDedupeKey() in the
 * scripts layer (scripts/deduplication/generate-dedupe-key.ts) exactly.
 * Both must produce identical output for the same company/title/location.
 */
const buildDedupeKey = (input: {
  company: string;
  title: string;
  location: string | null;
}): string => {
  const normalize = (v: string | null | undefined): string =>
    (v ?? "").toLowerCase().replace(/\s+/g, " ").trim();

  const raw = [
    normalize(input.company),
    normalize(input.title),
    normalize(input.location),
  ].join("|");

  return createHash("sha256").update(raw).digest("hex");
};

const normalizeJob = (job: RawJobInput): NormalizedJobInput => {
  const company = normalizeText(job.company);
  const title = normalizeText(job.title);
  const applyUrl = normalizeText(job.applyUrl);

  if (!company || !title || !applyUrl) {
    throw new ApiError(400, "Job requires company, title, applyUrl");
  }

  const location = normalizeText(job.location ?? null);
  const postedAt =
    job.postedAt instanceof Date
      ? job.postedAt
      : job.postedAt
        ? new Date(job.postedAt)
        : null;

  return {
    source: job.source,
    company,
    title,
    dedupeKey: buildDedupeKey({
      company,
      title,
      location,
    }),
    location,
    department: normalizeText(job.department ?? null),
    employmentType: job.employmentType ?? null,
    description: normalizeText(job.description ?? null),
    applyUrl,
    postedAt: postedAt && !Number.isNaN(postedAt.valueOf()) ? postedAt : null,
    isRemote: Boolean(job.isRemote),
    experienceLevel: job.experienceLevel ?? null,
    minSalary: job.minSalary ?? 0,
    maxSalary: job.maxSalary ?? 0,
    externalId: normalizeText(job.externalId ?? null),
    companyLogo: normalizeText(job.companyLogo ?? null),
  };
};

export const ingestJobs = async (
  jobs: RawJobInput[],
): Promise<IngestionResult> => {
  const result: IngestionResult = {
    received: jobs.length,
    created: 0,
    skipped: 0,
    errors: [],
    alertsGenerated: 0,
    emailsEnqueued: 0,
  };

  for (let i = 0; i < jobs.length; i += 1) {
    const raw = jobs[i];
    try {
      const normalized = normalizeJob(raw);
      const existing = await findJobByDedupe({
        dedupeKey: normalized.dedupeKey,
      });

      if (existing) {
        result.skipped += 1;
        continue;
      }

      let created;
      try {
        created = await createJob(normalized);
        result.created += 1;
      } catch (error) {
        const code =
          typeof (error as { code?: string }).code === "string"
            ? (error as { code?: string }).code
            : undefined;
        if (code === "P2002") {
          result.skipped += 1;
          continue;
        }
        throw error;
      }

      const matchResult = await matchJobToUsers({
        jobId: created.id,
        company: created.company,
        title: created.title,
        location: created.location,
        isRemote: created.isRemote,
        description: created.description,
      });
      result.alertsGenerated += matchResult.notified;
      result.emailsEnqueued += matchResult.notified;
    } catch (error) {
      result.errors.push({
        index: i,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
};
