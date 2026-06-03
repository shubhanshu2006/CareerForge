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
 * Filters a batch of normalized jobs against the database using two bulk
 * queries instead of one query per job.
 *
 * Two-stage check (batch mode):
 *   1. Fetch all existing (source, sourceJobId) pairs in one query
 *   2. Fetch all existing dedupeKeys in one query
 *
 * Any job matching either set is a duplicate and gets skipped.
 */
export const deduplicateJobs = async (
  jobs: NormalizedJob[]
): Promise<DedupeResult> => {
  if (jobs.length === 0) return { toInsert: [], skipped: 0 };

  // ── Stage 1: bulk source+id lookup ──────────────────────────────────────────
  const jobsWithSourceId = jobs.filter((j) => j.source && j.sourceJobId);

  const existingBySourceId = new Set<string>();
  if (jobsWithSourceId.length > 0) {
    // Build OR filter for all (source, sourceJobId) pairs
    const existing = await prisma.job.findMany({
      where: {
        OR: jobsWithSourceId.map((j) => ({
          source: j.source as never,
          sourceJobId: j.sourceJobId!,
        })),
      },
      select: { source: true, sourceJobId: true },
    });
    for (const row of existing) {
      if (row.sourceJobId) {
        existingBySourceId.add(`${row.source}:${row.sourceJobId}`);
      }
    }
  }

  // ── Stage 2: bulk dedupeKey lookup ──────────────────────────────────────────
  const allDedupeKeys = jobs
    .map((j) => j.dedupeKey)
    .filter((k): k is string => Boolean(k));

  const existingDedupeKeys = new Set<string>();
  if (allDedupeKeys.length > 0) {
    const existing = await prisma.job.findMany({
      where: { dedupeKey: { in: allDedupeKeys } },
      select: { dedupeKey: true },
    });
    for (const row of existing) {
      if (row.dedupeKey) existingDedupeKeys.add(row.dedupeKey);
    }
  }

  // ── Filter ───────────────────────────────────────────────────────────────────
  const toInsert: NormalizedJob[] = [];
  let skipped = 0;

  for (const job of jobs) {
    const sourceIdKey =
      job.source && job.sourceJobId
        ? `${job.source}:${job.sourceJobId}`
        : null;

    const isDuplicate =
      (sourceIdKey && existingBySourceId.has(sourceIdKey)) ||
      (job.dedupeKey && existingDedupeKeys.has(job.dedupeKey));

    if (isDuplicate) {
      skipped += 1;
    } else {
      toInsert.push(job);
    }
  }

  return { toInsert, skipped };
};
