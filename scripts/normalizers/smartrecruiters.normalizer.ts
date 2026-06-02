import type { NormalizedJob } from "../types/normalized-job.js";
import type { SmartRecruitersRawJob } from "../scrapers/smartrecruiters/smartrecruiters.scraper.js";
import { generateDedupeKey } from "../deduplication/generate-dedupe-key.js";

const SOURCE = "OTHER" as const;

export const normalizeSmartRecruitersJob = (raw: SmartRecruitersRawJob): NormalizedJob => {
  const company = raw.company?.trim() || "Unknown Company";
  const title = raw.title?.trim() ?? "";
  const location = raw.location?.trim() ?? "";
  const dedupeKey = generateDedupeKey({ company, title, location });

  return {
    source: SOURCE,
    sourceJobId: raw.id,
    company,
    title,
    location: location || undefined,
    department: raw.department?.trim() || undefined,
    applyUrl: raw.applyUrl,
    postedAt: raw.postedAt ? new Date(raw.postedAt) : undefined,
    isRemote: raw.isRemote,
    dedupeKey,
  };
};

export const normalizeSmartRecruitersJobs = (raw: SmartRecruitersRawJob[]): NormalizedJob[] => {
  const out: NormalizedJob[] = [];
  for (const job of raw) {
    if (!job.id || !job.title || !job.applyUrl) continue;
    try {
      out.push(normalizeSmartRecruitersJob(job));
    } catch {
      // skip malformed
    }
  }
  return out;
};
