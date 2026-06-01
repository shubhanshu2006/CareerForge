/**
 * Workday Job Normalizer.
 *
 * Converts raw Workday API job postings (from workday.scraper.ts)
 * into the platform-agnostic NormalizedJob format.
 *
 * Workday jobs are fetched via the undocumented POST /wday/cxs/{tenant}/jobs
 * API. The response includes typed location objects, employment types, and
 * relative URL paths that we resolve to absolute URLs.
 */

import type { NormalizedJob } from "../types/normalized-job.js";
import type {
  WorkdayJobPosting,
  WorkdayScrapeResult,
} from "../scrapers/workday/workday.scraper.js";
import { generateDedupeKey } from "../deduplication/generate-dedupe-key.js";

const SOURCE = "WORKDAY";

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
 * Map Workday's timeType + workerSubType to our EmploymentType enum.
 */
const normalizeEmploymentType = (
  timeType?: string,
  workerSubType?: string,
): NormalizedJob["employmentType"] => {
  const tt = (timeType ?? "").toLowerCase();
  const ws = (workerSubType ?? "").toLowerCase();

  if (ws.includes("intern")) return "INTERNSHIP";
  if (ws.includes("contract") || ws.includes("contingent")) return "CONTRACT";
  if (ws.includes("temp")) return "TEMPORARY";
  if (tt.includes("part")) return "PART_TIME";
  return "FULL_TIME";
};

/**
 * Build an absolute apply URL from a Workday externalPath.
 * The externalPath is relative: "/en-US/External_Career_Site/job/..."
 */
const buildApplyUrl = (
  result: WorkdayScrapeResult,
  externalPath: string,
): string => {
  const { subdomain, instance, tenant } = result.company;
  const base = `https://${subdomain}.wd${instance}.myworkdayjobs.com`;

  // Already absolute
  if (externalPath.startsWith("http")) return externalPath;

  // Relative path — prepend the Workday base URL
  return `${base}${externalPath.startsWith("/") ? "" : "/"}${externalPath}`;
};

/**
 * Extract the primary location string from a Workday job posting.
 * Workday provides either a formatted `locationsText` or an array of
 * `locations` objects. We prefer the formatted string.
 */
const extractLocation = (job: WorkdayJobPosting): string => {
  if (job.locationsText?.trim()) return job.locationsText.trim();
  if (job.primaryLocation?.descriptor?.trim())
    return job.primaryLocation.descriptor.trim();
  if (Array.isArray(job.locations) && job.locations.length > 0)
    return job.locations[0].descriptor?.trim() ?? "";
  return "";
};

/**
 * Normalise a single raw Workday posting into a NormalizedJob.
 */
export const normalizeWorkdayJob = (
  raw: WorkdayJobPosting,
  result: WorkdayScrapeResult,
): NormalizedJob => {
  const company = result.company.displayName;
  const title = raw.title?.trim() ?? "";
  const location = extractLocation(raw);
  const applyUrl = buildApplyUrl(result, raw.externalPath ?? "");
  const sourceJobId = raw.id;

  const isRemote = isRemoteLocation(location);

  const employmentType = normalizeEmploymentType(
    raw.timeType?.descriptor,
    raw.workerSubType?.descriptor,
  );

  const postedAt =
    raw.postedOn || raw.startDate
      ? new Date(raw.postedOn ?? raw.startDate!)
      : undefined;

  const dedupeKey = generateDedupeKey({ company, title, location });

  return {
    source: SOURCE,
    sourceJobId,
    sourceUrl: applyUrl,
    company,
    title,
    location: location || undefined,
    employmentType,
    description: raw.jobDescription || undefined,
    applyUrl,
    postedAt,
    isRemote,
    dedupeKey,
  };
};

/**
 * Normalise all raw Workday postings from a scrape result.
 * Malformed / incomplete postings are silently dropped.
 */
export const normalizeWorkdayJobs = (
  result: WorkdayScrapeResult,
): NormalizedJob[] => {
  const out: NormalizedJob[] = [];

  for (const job of result.jobs) {
    if (!job.title || !job.externalPath) continue;
    try {
      out.push(normalizeWorkdayJob(job, result));
    } catch {
      // Skip malformed entries silently
    }
  }

  return out;
};
