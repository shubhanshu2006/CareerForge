import type { NormalizedJob } from "../types/normalized-job.js";
import type { AdzunaRawJob } from "../scrapers/adzuna/adzuna.scraper.js";
import { generateDedupeKey } from "../deduplication/generate-dedupe-key.js";

const SOURCE = "ADZUNA";

const REMOTE_PATTERNS = [/\bremote\b/i, /\bwork from home\b/i, /\bwfh\b/i];

const isRemoteLocation = (location?: string): boolean => {
  if (!location) return false;
  return REMOTE_PATTERNS.some((re) => re.test(location));
};

const normalizeEmploymentType = (
  contractTime?: string,
  contractType?: string,
): NormalizedJob["employmentType"] => {
  const ct = contractTime?.toLowerCase() ?? "";
  const ctype = contractType?.toLowerCase() ?? "";

  if (ct.includes("part")) return "PART_TIME";
  if (ct.includes("full")) return "FULL_TIME";
  if (ctype.includes("contract")) return "CONTRACT";
  if (ctype.includes("temporary")) return "TEMPORARY";
  if (ctype.includes("permanent")) return "FULL_TIME";
  return undefined;
};

export const normalizeAdzunaJob = (raw: AdzunaRawJob): NormalizedJob => {
  const company = raw.company?.display_name?.trim() || "Unknown Company";
  const title = raw.title?.trim() ?? "";
  const location = raw.location?.display_name?.trim() ?? "";
  const applyUrl = raw.redirect_url?.trim() ?? "";

  const dedupeKey = generateDedupeKey({ company, title, location });

  return {
    source: SOURCE,
    sourceJobId: raw.id,
    sourceUrl: applyUrl,
    company,
    title,
    location: location || undefined,
    department: raw.category?.label?.trim() || undefined,
    employmentType: normalizeEmploymentType(raw.contract_time, raw.contract_type),
    description: raw.description?.trim() || undefined,
    applyUrl,
    postedAt: raw.created ? new Date(raw.created) : undefined,
    isRemote: isRemoteLocation(location),
    minSalary: raw.salary_min ?? undefined,
    maxSalary: raw.salary_max ?? undefined,
    dedupeKey,
  };
};

export const normalizeAdzunaJobs = (raw: AdzunaRawJob[]): NormalizedJob[] => {
  const out: NormalizedJob[] = [];
  for (const job of raw) {
    if (!job.id || !job.title || !job.redirect_url) continue;
    try {
      out.push(normalizeAdzunaJob(job));
    } catch {
      // Skip malformed entries silently
    }
  }
  return out;
};
