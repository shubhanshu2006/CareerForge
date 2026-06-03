import { createHash } from "crypto";
import type {
  EmploymentType,
  ExperienceLevel,
  Source,
} from "../../generated/prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import {
  createJobsBulk,
  NormalizedJobInput,
} from "../repositories/jobIngestion.repository.js";
import { matchJobsBatch } from "./job-matching.service.js";

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

const normalizeJob = (
  job: RawJobInput,
  index: number,
  errors: IngestionResult["errors"],
): NormalizedJobInput | null => {
  try {
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
      dedupeKey: buildDedupeKey({ company, title, location }),
      location,
      department: normalizeText(job.department ?? null),
      employmentType: job.employmentType ?? null,
      description: normalizeText(job.description ?? null),
      applyUrl,
      postedAt:
        postedAt && !Number.isNaN(postedAt.valueOf()) ? postedAt : null,
      isRemote: Boolean(job.isRemote),
      experienceLevel: job.experienceLevel ?? null,
      minSalary: job.minSalary ?? 0,
      maxSalary: job.maxSalary ?? 0,
      externalId: normalizeText(job.externalId ?? null),
      companyLogo: normalizeText(job.companyLogo ?? null),
    };
  } catch (error) {
    errors.push({
      index,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
};

// Chunk an array into slices of at most `size` elements
const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const BULK_INSERT_CHUNK = 500; // stay well within Postgres parameter limits

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

  if (jobs.length === 0) return result;

  // ── Phase 1: normalize ────────────────────────────────────────────────────────
  const normalized: NormalizedJobInput[] = [];
  for (let i = 0; i < jobs.length; i++) {
    const n = normalizeJob(jobs[i], i, result.errors);
    if (n) normalized.push(n);
  }

  // ── Phase 2: bulk insert in chunks ───────────────────────────────────────────
  // createManyAndReturn with skipDuplicates handles race-condition P2002s.
  // Chunking keeps Postgres parameter count under the ~65k limit.
  const createdJobs: Array<{
    id: number;
    company: string;
    title: string;
    location: string | null;
    isRemote: boolean;
    description: string | null;
  }> = [];

  for (const batch of chunk(normalized, BULK_INSERT_CHUNK)) {
    try {
      const inserted = await createJobsBulk(batch);
      createdJobs.push(...inserted);
      result.created += inserted.length;
      result.skipped += batch.length - inserted.length; // rows skipped by skipDuplicates
    } catch (error) {
      // Fallback: if the whole chunk fails for an unexpected reason, record it
      result.errors.push({
        index: -1,
        reason: error instanceof Error ? error.message : "Bulk insert failed",
      });
    }
  }

  // ── Phase 3: batch match all new jobs against users in one pass ───────────────
  if (createdJobs.length > 0) {
    const matchResult = await matchJobsBatch(
      createdJobs.map((j) => ({ ...j, jobId: j.id })),
    );
    result.alertsGenerated = matchResult.notified;
    result.emailsEnqueued = matchResult.notified;
  }

  return result;
};
