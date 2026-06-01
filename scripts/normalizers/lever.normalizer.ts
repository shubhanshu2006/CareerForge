import type { NormalizedJob } from "../types/normalized-job.js";
import type { LeverRawJob } from "../scrapers/lever/lever.scraper.js";
import { generateDedupeKey } from "../deduplication/generate-dedupe-key.js";

const SOURCE = "LEVER";

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
 * Map Lever's `commitment` string to a structured employment type.
 * Lever uses free-text here so we do fuzzy matching.
 */
const normalizeEmploymentType = (
  commitment?: string,
): NormalizedJob["employmentType"] => {
  if (!commitment) return undefined;
  const c = commitment.toLowerCase();
  if (c.includes("intern")) return "INTERNSHIP";
  if (c.includes("part")) return "PART_TIME";
  if (c.includes("contract") || c.includes("freelance")) return "CONTRACT";
  if (c.includes("temp")) return "TEMPORARY";
  return "FULL_TIME";
};

/**
 * Normalise a Lever board identifier into a human-readable company name.
 * e.g. "my-company-name" → "My Company Name"
 */
const toTitleCase = (slug: string): string =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Normalise a single raw Lever posting into a platform-agnostic NormalizedJob.
 */
export const normalizeLeverJob = (
  raw: LeverRawJob,
  companySlug: string,
): NormalizedJob => {
  const company = toTitleCase(companySlug);
  const title = raw.text?.trim() ?? "";
  const location = raw.categories?.location?.trim() ?? "";
  const applyUrl = (raw.applyUrl ?? raw.hostedUrl)?.trim() ?? "";
  const sourceJobId = raw.id;

  const isRemote = isRemoteLocation(location);
  const employmentType = normalizeEmploymentType(raw.categories?.commitment);
  const department = raw.categories?.department?.trim() || undefined;

  const dedupeKey = generateDedupeKey({ company, title, location });

  return {
    source: SOURCE,
    sourceJobId,
    sourceUrl: raw.hostedUrl,
    company,
    title,
    location: location || undefined,
    department,
    employmentType,
    applyUrl,
    postedAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
    isRemote,
    dedupeKey,
  };
};

/**
 * Normalise an array of raw Lever postings for a given company.
 * Incomplete / malformed postings are silently dropped.
 */
export const normalizeLeverJobs = (
  raw: LeverRawJob[],
  companySlug: string,
): NormalizedJob[] => {
  const out: NormalizedJob[] = [];

  for (const job of raw) {
    if (!job.text || !job.hostedUrl) continue;
    try {
      out.push(normalizeLeverJob(job, companySlug));
    } catch {
      // Skip malformed jobs silently
    }
  }

  return out;
};
