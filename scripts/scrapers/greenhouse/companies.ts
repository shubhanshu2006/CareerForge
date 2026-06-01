/**
 * Greenhouse company board slugs.
 * These are the identifiers used in the Greenhouse Boards API:
 * https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
 *
 * Only include companies with confirmed public Greenhouse boards.
 * Companies returning 404 have been removed.
 */
export const greenhouseCompanies: string[] = [
  // Fintech / Payments
  "stripe",
  "brex",
  "robinhood",

  // Productivity / Collaboration
  "figma",
  "dropbox",
  "airtable",

  // Infrastructure / DevTools
  "datadog",

  // Consumer / Social
  "reddit",
  "pinterest",
  "duolingo",

  // Enterprise SaaS
  "hubspot",

  // AI / ML
  // Note: Anthropic is also in company-sites/companies.ts (Playwright scraper).
  // The Greenhouse API is the primary source; company-sites results will be
  // deduped at ingestion time via company+title+location key.
  "anthropic",
  "okta",
  "cloudflare",
  "elastic",
  "mongodb",
  "pagerduty",
  "mixpanel",
  "benchling",
  "asana",
  "zendesk",
  "zendesk",
];
