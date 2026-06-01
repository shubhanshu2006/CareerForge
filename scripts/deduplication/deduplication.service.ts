import type { NormalizedJob } from "../types/normalized-job.js";
import { prisma } from "../../backend/src/config/prisma.js";

/**
 * Deduplication result — jobs that passed all checks and are safe to insert.
 */
export interface DedupeResult {
  toInsert: NormalizedJob[];
  skipped: number;
}

/**
 * Checks whether a job already exists in the database.
 *
 * Two-stage check:
 *   1. source + sourceJobId match  → definitive duplicate (same job from same board)
 *   2. dedupeKey match             → content duplicate (same job, different source)
 *
 * @param job - The normalized job to check
 * @returns true if the job should be skipped
 */
const isDuplicate = async (job: NormalizedJob): Promise<boolean> => {
  // Fast path: exact source + id combo
  if (job.source && job.sourceJobId) {
    const existing = await prisma.job.findFirst({
      where: {
        source: job.source as never,
        sourceJobId: job.sourceJobId,
      },
      select: { id: true },
    });
    if (existing) return true;
  }

  // Content-hash path: same job posted under different source
  const existingByKey = await prisma.job.findFirst({
    where: { dedupeKey: job.dedupeKey },
    select: { id: true },
  });

  return Boolean(existingByKey);
};

/**
 * Filters a batch of normalized jobs against the database, returning only
 * the jobs that are genuinely new and safe to insert.
 *
 * Processes sequentially to keep DB load predictable, while still being fast
 * enough for typical batch sizes (< 1000 jobs per run).
 */
export const deduplicateJobs = async (
  jobs: NormalizedJob[]
): Promise<DedupeResult> => {
  const toInsert: NormalizedJob[] = [];
  let skipped = 0;

  for (const job of jobs) {
    const dup = await isDuplicate(job);
    if (dup) {
      skipped += 1;
    } else {
      toInsert.push(job);
    }
  }

  return { toInsert, skipped };
};
