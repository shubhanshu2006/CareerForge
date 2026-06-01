/**
 * Workday company configurations.
 *
 * Workday exposes a semi-public JSON API for job listings at:
 *   POST https://{subdomain}.wd{instance}.myworkdayjobs.com/wday/cxs/{tenant}/jobs
 *
 * Each company has:
 *   - subdomain: used in the hostname (e.g. "amazon")
 *   - instance: Workday instance number (usually 1, 2, 3, or 5)
 *   - tenant: path segment identifying the board (often same as subdomain)
 *   - displayName: human-readable company name
 *
 * Finding a company's Workday config:
 *   1. Visit their Workday job board (e.g. amazon.jobs → redirects to workday)
 *   2. Open DevTools → Network → look for a POST to /wday/cxs/.../jobs
 *   3. Extract subdomain, instance, and tenant from the URL
 */

export interface WorkdayCompanyConfig {
  subdomain: string;
  instance: number;        // Workday server instance (1 | 2 | 3 | 5)
  tenant: string;          // Board tenant path segment
  displayName: string;
  /**
   * Optional: limit of jobs to fetch per request.
   * Workday default is 20; max is typically 100.
   */
  limit?: number;
}

export const workdayCompanies: WorkdayCompanyConfig[] = [
  // Big Tech
  {
    subdomain: "amazon",
    instance: 5,
    tenant: "Amazon_Global",
    displayName: "Amazon",
    limit: 100,
  },
  {
    subdomain: "apple",
    instance: 1,
    tenant: "apple",
    displayName: "Apple",
    limit: 100,
  },
  {
    subdomain: "meta",
    instance: 5,
    tenant: "FacebookCareers",
    displayName: "Meta",
    limit: 100,
  },

  // Enterprise SaaS
  {
    subdomain: "salesforce",
    instance: 2,
    tenant: "salesforce",
    displayName: "Salesforce",
    limit: 100,
  },
  {
    subdomain: "workday",
    instance: 1,
    tenant: "workday",
    displayName: "Workday",
    limit: 100,
  },
  {
    subdomain: "servicenow",
    instance: 1,
    tenant: "servicenow",
    displayName: "ServiceNow",
    limit: 100,
  },

  // Finance / Fintech
  {
    subdomain: "goldmansachs",
    instance: 1,
    tenant: "gs",
    displayName: "Goldman Sachs",
    limit: 100,
  },
  {
    subdomain: "jpmorgan",
    instance: 1,
    tenant: "JPMorgan",
    displayName: "JPMorgan",
    limit: 100,
  },

  // Healthcare / Biotech
  {
    subdomain: "abbvie",
    instance: 5,
    tenant: "abbvie",
    displayName: "AbbVie",
    limit: 100,
  },
];
