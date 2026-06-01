import type { NormalizedJob } from "../types/normalized-job.js";
import type { GreenhouseRawJob } from "../scrapers/greenhouse/greenhouse.scraper.js";
import { generateDedupeKey } from "../deduplication/generate-dedupe-key.js";

const SOURCE = "GREENHOUSE";

/**
 * Remote-detection patterns applied against the location string.
 * We treat a job as remote when the location contains any of these tokens.
 */
const REMOTE_PATTERNS = [
  /\bremote\b/i,
  /\banywhere\b/i,
  /\bwork from home\b/i,
  /\bwfh\b/i,
  /\bdistributed\b/i,
];

const isRemoteLocation = (location: string): boolean =>
  REMOTE_PATTERNS.some((re) => re.test(location));

/**
 * Capitalise the first letter of each word (Title Case).
 * Used to normalise company names derived from slugs.
 */
const toTitleCase = (slug: string): string =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Normalise a single raw Greenhouse job into a platform-agnostic NormalizedJob.
 *
 * @param raw       - Raw job object returned by the Greenhouse Boards API
 * @param companySlug - The board slug used to fetch this job (e.g. "stripe")
 */
export const normalizeGreenhouseJob = (
  raw: GreenhouseRawJob,
  companySlug: string,
): NormalizedJob => {
  const company = toTitleCase(companySlug);
  const title = raw.title?.trim() ?? "";
  const location = raw.location?.name?.trim() ?? "";
  const applyUrl = raw.absolute_url?.trim() ?? "";
  const sourceJobId = String(raw.id);

  // Department: take the first entry if available
  const department =
    Array.isArray(raw.departments) && raw.departments.length > 0
      ? raw.departments[0].name
      : undefined;

  // Remote detection
  const isRemote = isRemoteLocation(location);

  const dedupeKey = generateDedupeKey({ company, title, location });

  return {
    source: SOURCE,
    sourceJobId,
    sourceUrl: applyUrl,
    company,
    title,
    location: location || undefined,
    department,
    applyUrl,
    postedAt: raw.updated_at ? new Date(raw.updated_at) : undefined,
    isRemote,
    dedupeKey,
  };
};

/**
 * Normalise an array of raw Greenhouse jobs for a given company.
 * Invalid / incomplete jobs are silently dropped.
 */
export const normalizeGreenhouseJobs = (
  raw: GreenhouseRawJob[],
  companySlug: string,
): NormalizedJob[] => {
  const out: NormalizedJob[] = [];

  for (const job of raw) {
    if (!job.title || !job.absolute_url) {
      continue;
    }
    try {
      out.push(normalizeGreenhouseJob(job, companySlug));
    } catch {
      // Skip malformed jobs silently
    }
  }

  return out;
};
