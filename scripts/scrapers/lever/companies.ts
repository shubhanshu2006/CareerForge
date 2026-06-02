/**
 * Lever company board identifiers.
 *
 * These are the slugs used in the Lever Posting API:
 * https://api.lever.co/v0/postings/{company}?mode=json
 *
 * Find a company's slug: visit their Lever jobs page, e.g.
 * https://jobs.lever.co/netflix → slug is "netflix"
 */
export const leverCompanies: string[] = [
  // Confirmed active Lever boards with global/India listings
  "netflix",
  "spotify",
  "intercom",
  "airtable",
  "braintree",
  "lark",              // ByteDance Lark
  "cashapp",

  // India-specific companies confirmed on Lever
  "freshworks",        // Freshworks has Lever board
  "clevertap",
  "moengage",
  "chargebee",
  "browserstack",
  "postman",
  "razorpay",
  "taskus",
  "dream11",
];
