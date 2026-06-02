import type { NormalizedJob } from "../types/normalized-job.js";
import type { SkillCareerHubRawJob } from "../scrapers/skillcareerhub/skillcareerhub.scraper.js";
import { generateDedupeKey } from "../deduplication/generate-dedupe-key.js";

const SOURCE = "SKILLCAREERHUB";

const REMOTE_PATTERNS = [/\bremote\b/i, /\bwork from home\b/i, /\bwfh\b/i];

const normalizeEmploymentType = (
  value?: string,
): NormalizedJob["employmentType"] => {
  const v = value?.toLowerCase() ?? "";
  if (!v) return undefined;
  if (v.includes("intern")) return "INTERNSHIP";
  if (v.includes("part")) return "PART_TIME";
  if (v.includes("contract") || v.includes("freelance")) return "CONTRACT";
  if (v.includes("temp")) return "TEMPORARY";
  if (v.includes("full") || v.includes("permanent")) return "FULL_TIME";
  return undefined;
};

export const normalizeSkillCareerHubJob = (
  raw: SkillCareerHubRawJob,
): NormalizedJob => {
  const company = raw.company?.trim() || "SkillCareerHub";
  const title = raw.title?.trim() ?? "";
  const location = raw.location?.trim() ?? "";
  const applyUrl = raw.link?.trim() ?? "";
  const dedupeKey = generateDedupeKey({ company, title, location });

  return {
    source: SOURCE,
    sourceJobId: raw.id,
    sourceUrl: applyUrl,
    company,
    title,
    location: location || undefined,
    employmentType: normalizeEmploymentType(raw.employmentType),
    description: raw.description?.trim() || undefined,
    applyUrl,
    postedAt: raw.postedAt ? new Date(raw.postedAt) : undefined,
    isRemote: REMOTE_PATTERNS.some((re) => re.test(location)),
    dedupeKey,
  };
};

export const normalizeSkillCareerHubJobs = (
  raw: SkillCareerHubRawJob[],
): NormalizedJob[] => {
  const out: NormalizedJob[] = [];
  for (const job of raw) {
    if (!job.id || !job.title || !job.link) continue;
    try {
      out.push(normalizeSkillCareerHubJob(job));
    } catch {
      // Skip malformed jobs silently
    }
  }
  return out;
};
