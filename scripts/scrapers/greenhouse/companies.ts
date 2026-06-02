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
  "plaid",
  "ramp",

  // Productivity / Collaboration
  "figma",
  "dropbox",
  "airtable",
  "notion",

  // Infrastructure / DevTools
  "datadog",
  "cockroachlabs",
  "netlify",
  "launchdarkly",
  "contentful",
  "segment",

  // Consumer / Social
  "reddit",
  "pinterest",
  "duolingo",
  "discord",
  "snap",

  // Enterprise SaaS
  "hubspot",
  "zendesk",
  "grammarly",
  "squarespace",
  "twilio",

  // AI / ML / Data
  "anthropic",
  "databricks",
  "mixpanel",
  "amplitude",
  "heap",

  // India-focused
  "flipkart",
  "canva",

  // Security / Infra
  "okta",
  "cloudflare",
  "elastic",
  "mongodb",
  "pagerduty",
  "benchling",
  "asana",
];
