/**
 * Company Site Registry.
 *
 * Defines each company's career page configuration for the Playwright-based
 * scraper. Unlike Greenhouse/Lever/Ashby, these companies host their own
 * job boards and require browser automation to extract listings.
 *
 * Configuration fields:
 *   - name:       Human-readable company name
 *   - careersUrl: The URL of the careers / jobs listing page
 *   - type:       Scraper strategy to use for this site
 *   - selectors:  CSS selectors for the scraper to extract data
 */

export type CompanySiteType = "openai" | "anthropic" | "perplexity" | "generic";

export interface CompanySiteConfig {
  name: string;
  careersUrl: string;
  type: CompanySiteType;
  /**
   * CSS selectors used to locate job listings on the page.
   * Different sites use different DOM structures.
   */
  selectors: {
    /** Container wrapping all job items */
    jobList?: string;
    /** Individual job card / row */
    jobItem: string;
    /** Job title within a job item */
    title: string;
    /** Location within a job item */
    location?: string;
    /** Department / team within a job item */
    department?: string;
    /** Link to job detail page (href) */
    link: string;
  };
  /** Optional: base URL to prepend to relative links */
  baseUrl?: string;
}

export const companySites: CompanySiteConfig[] = [
  {
    name: "OpenAI",
    careersUrl: "https://openai.com/careers/search",
    type: "openai",
    baseUrl: "https://openai.com",
    selectors: {
      jobItem: '[data-testid="jobs-list-item"], .ui-list-item, article',
      title: 'h3, h2, [class*="title"], [class*="heading"]',
      location: '[class*="location"], [class*="meta"]',
      department: '[class*="department"], [class*="team"]',
      link: "a",
    },
  },
  {
    name: "Anthropic",
    careersUrl: "https://www.anthropic.com/careers#open-roles",
    type: "anthropic",
    baseUrl: "https://www.anthropic.com",
    selectors: {
      jobItem: '[class*="job"], [class*="opening"], [class*="role"], li',
      title: 'h3, h2, h4, [class*="title"], [class*="position"]',
      location: '[class*="location"], [class*="place"]',
      department: '[class*="team"], [class*="department"]',
      link: "a",
    },
  },
  {
    name: "Perplexity",
    careersUrl: "https://www.perplexity.ai/careers",
    type: "perplexity",
    baseUrl: "https://www.perplexity.ai",
    selectors: {
      jobItem: '[class*="job"], [class*="role"], [class*="position"], li, article',
      title: 'h3, h2, h4, [class*="title"], strong',
      location: '[class*="location"], [class*="remote"]',
      department: '[class*="team"], [class*="department"]',
      link: "a",
    },
  },
];
