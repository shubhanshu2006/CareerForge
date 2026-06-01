import type { NormalizedJob } from "../types/normalized-job.js";
import type { AshbyRawJob } from "../scrapers/ashby/ashby.scraper.js";
import { generateDedupeKey } from "../deduplication/generate-dedupe-key.js";

const SOURCE = "ASHBY";

/**
 * Maps Ashby employment type strings → our EmploymentType enum values.
 * Ashby uses PascalCase strings (FullTime, PartTime, Contractor, Intern).
 */
const normalizeEmploymentType = (
  employmentType?: string,
): NormalizedJob["employmentType"] => {
  if (!employmentType) return undefined;

  const et = employmentType.toLowerCase().replace(/[^a-z]/g, "");
  if (et.includes("intern")) return "INTERNSHIP";
  if (et.includes("part")) return "PART_TIME";
  if (et.includes("contract") || et.includes("freelance")) return "CONTRACT";
  if (et.includes("temp")) return "TEMPORARY";
  return "FULL_TIME";
};

/**
 * Derive a human-readable company name from the Ashby board identifier.
 * e.g. "my-company" → "My Company"
 */
const toTitleCase = (slug: string): string =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Extract salary bounds from Ashby's compensation object.
 * Ashby stores compensation in the currency's smallest unit for some
 * currencies, so we normalise to a whole-number USD value.
 */
const parseSalary = (
  compensation?: AshbyRawJob["compensation"],
): { minSalary?: number; maxSalary?: number } => {
  if (!compensation) return {};
  const { minValue, maxValue, interval } = compensation;
  // Only include yearly compensation to keep values comparable
  if (interval && interval.toUpperCase() !== "YEARLY") return {};
  return {
    minSalary: minValue ?? undefined,
    maxSalary: maxValue ?? undefined,
  };
};

/**
 * Normalise a single raw Ashby posting into a platform-agnostic NormalizedJob.
 */
export const normalizeAshbyJob = (
  raw: AshbyRawJob,
  companySlug: string,
): NormalizedJob => {
  const company = toTitleCase(companySlug);
  const title = raw.title?.trim() ?? "";
  const applyUrl = (raw.applyUrl ?? raw.jobUrl)?.trim() ?? "";
  const sourceJobId = raw.id;

  // Location: prefer the top-level locationName, fall back to location object
  const location =
    raw.locationName?.trim() || raw.location?.locationStr?.trim() || "";

  // Remote: explicit flag wins; fall back to location string pattern
  const isRemote =
    raw.isRemote === true ||
    raw.location?.isRemote === true ||
    /\bremote\b/i.test(location);

  const department =
    raw.departmentName?.trim() || raw.teamName?.trim() || undefined;

  const employmentType = normalizeEmploymentType(raw.employmentType);

  const { minSalary, maxSalary } = parseSalary(raw.compensation);

  const postedAt = raw.publishedDate
    ? new Date(raw.publishedDate)
    : raw.updatedAt
      ? new Date(raw.updatedAt)
      : undefined;

  const dedupeKey = generateDedupeKey({ company, title, location });

  return {
    source: SOURCE,
    sourceJobId,
    sourceUrl: raw.jobUrl,
    company,
    title,
    location: location || undefined,
    department,
    employmentType,
    applyUrl,
    postedAt,
    isRemote,
    minSalary,
    maxSalary,
    dedupeKey,
  };
};

/**
 * Normalise an array of raw Ashby postings for a given company.
 * Incomplete / malformed postings are silently dropped.
 */
export const normalizeAshbyJobs = (
  raw: AshbyRawJob[],
  companySlug: string,
): NormalizedJob[] => {
  const out: NormalizedJob[] = [];

  for (const job of raw) {
    if (!job.title || !job.applyUrl) continue;
    try {
      out.push(normalizeAshbyJob(job, companySlug));
    } catch {
      // Skip malformed jobs silently
    }
  }

  return out;
};
