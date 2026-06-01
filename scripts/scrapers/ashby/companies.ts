/**
 * Ashby company identifiers.
 *
 * These are the slugs used in the Ashby Job Board Posting API:
 * https://api.ashbyhq.com/posting-api/job-board/{companyIdentifier}
 *
 * Find a company's slug: visit their Ashby job board URL, e.g.
 * https://jobs.ashbyhq.com/cursor → identifier is "cursor"
 */
export const ashbyCompanies: string[] = [
  // AI-native tools
  "cursor",
  "linear",
  "retool",

  // Data / CRM
  "clay",
  "attio",
  "apollo",

  // Talent / Marketplace
  "mercor",
  "contra",
  "remote",

  // Security
  "vanta",
  "drata",

  // Infra / DevTools
  "dagger",
  "railway",
  "render",

  // FinTech
  "ramp",
  "mercury",

  // AI Research / Products
  "perplexity",
  "mistral",
  "together",
];
