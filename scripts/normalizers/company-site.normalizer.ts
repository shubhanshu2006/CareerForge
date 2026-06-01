/**
 * Company Sites Normalizer.
 *
 * Converts raw job data extracted by the Playwright company-sites scraper
 * into the platform-agnostic NormalizedJob format.
 *
 * Since company sites have highly variable structures, the raw data is
 * minimal (title, link, location, department) and we infer as much as
 * possible from these fields.
 */

import type { NormalizedJob } from "../types/normalized-job.js";
import type { CompanySiteRawJob } from "../scrapers/company-sites/company.scraper.js";
import { generateDedupeKey } from "../deduplication/generate-dedupe-key.js";

const SOURCE = "COMPANY_WEBSITE";

const REMOTE_PATTERNS = [
  /\bremote\b/i,
  /\banywhere\b/i,
  /\bwfh\b/i,
  /\bdistributed\b/i,
  /\bwork from home\b/i,
];

const isRemoteLocation = (location?: string): boolean => {
  if (!location) return false;
  return REMOTE_PATTERNS.some((re) => re.test(location));
};

/**
 * Infer employment type from job title keywords.
 * Company site jobs rarely include structured employment type data.
 */
const inferEmploymentType = (
  title: string,
): NormalizedJob["employmentType"] => {
  const t = title.toLowerCase();
  if (t.includes("intern") || t.includes("internship")) return "INTERNSHIP";
  if (t.includes("contract") || t.includes("freelance")) return "CONTRACT";
  if (t.includes("part-time") || t.includes("part time")) return "PART_TIME";
  return undefined;
};

/**
 * Clean extracted text — remove excessive whitespace and
 * strip common boilerplate fragments that appear in scraped text.
 */
const cleanText = (text?: string | null): string | undefined => {
  if (!text) return undefined;
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

/**
 * Normalise a single raw company-site job into a NormalizedJob.
 */
export const normalizeCompanySiteJob = (
  raw: CompanySiteRawJob,
): NormalizedJob => {
  const company = raw.company.trim();
  const title = raw.title.trim();
  const location = cleanText(raw.location);
  const applyUrl = raw.link.trim();

  const isRemote = isRemoteLocation(location);
  const employmentType = inferEmploymentType(title);

  const dedupeKey = generateDedupeKey({
    company,
    title,
    location: location ?? null,
  });

  return {
    source: SOURCE,
    sourceUrl: applyUrl,
    company,
    title,
    location,
    department: cleanText(raw.department),
    employmentType,
    applyUrl,
    isRemote,
    dedupeKey,
  };
};

/**
 * Normalise an array of raw company-site jobs.
 * Jobs without a valid title or link are silently dropped.
 */
export const normalizeCompanySiteJobs = (
  raw: CompanySiteRawJob[],
): NormalizedJob[] => {
  const out: NormalizedJob[] = [];
  const seen = new Set<string>();

  for (const job of raw) {
    if (!job.title?.trim() || !job.link?.trim()) continue;

    // Deduplicate within the same scrape run by applyUrl
    if (seen.has(job.link)) continue;
    seen.add(job.link);

    try {
      out.push(normalizeCompanySiteJob(job));
    } catch {
      // Skip malformed entries silently
    }
  }

  return out;
};
