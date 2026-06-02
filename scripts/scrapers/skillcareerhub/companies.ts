/**
 * SkillCareerHub feed targets.
 *
 * SkillCareerHub can expose listings through different endpoints depending on
 * deployment. We keep a configurable list so the same scraper can pull from
 * one or many feeds.
 */
export interface SkillCareerHubSourceConfig {
  label: string;
  endpoint: string;
  maxPages?: number;
  perPage?: number;
}

const defaultEndpoint =
  process.env.SKILLCAREERHUB_API_URL?.trim() ||
  "https://skillcareerhub.com/wp-json/wp/v2/job-listings";

// SkillCareerHub's public API is currently returning 404.
// The sources array is intentionally empty to skip this pipeline until
// a working endpoint is confirmed. Re-enable by adding a config entry.
export const skillcareerhubSources: SkillCareerHubSourceConfig[] = [];
