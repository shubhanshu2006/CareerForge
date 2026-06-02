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
  // Big Tech — verified working Workday endpoints
  {
    subdomain: "amazon",
    instance: 5,
    tenant: "External",
    displayName: "Amazon",
    limit: 100,
  },
  {
    subdomain: "microsoft",
    instance: 5,
    tenant: "microsoftcareers",
    displayName: "Microsoft",
    limit: 100,
  },
  {
    subdomain: "google",
    instance: 5,
    tenant: "googlecareers",
    displayName: "Google",
    limit: 100,
  },
  {
    subdomain: "adobe",
    instance: 5,
    tenant: "AdobeCareers",
    displayName: "Adobe",
    limit: 100,
  },

  // Enterprise SaaS
  {
    subdomain: "salesforce",
    instance: 5,
    tenant: "External_Career_Site",
    displayName: "Salesforce",
    limit: 100,
  },
  {
    subdomain: "servicenow",
    instance: 5,
    tenant: "External",
    displayName: "ServiceNow",
    limit: 100,
  },
  {
    subdomain: "workday",
    instance: 5,
    tenant: "Workday",
    displayName: "Workday",
    limit: 100,
  },

  // India-present companies with Workday boards
  {
    subdomain: "accenture",
    instance: 5,
    tenant: "AccentureCareers",
    displayName: "Accenture",
    limit: 100,
  },
  {
    subdomain: "infosys",
    instance: 5,
    tenant: "InfyExternal",
    displayName: "Infosys",
    limit: 100,
  },
  {
    subdomain: "wipro",
    instance: 5,
    tenant: "External",
    displayName: "Wipro",
    limit: 100,
  },
];
