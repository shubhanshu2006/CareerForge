/**
 * Workday Job Board API Scraper.
 *
 * Workday does not provide an official public API, but every Workday-hosted
 * job board exposes a consistent undocumented JSON endpoint:
 *
 *   POST https://{subdomain}.wd{instance}.myworkdayjobs.com/wday/cxs/{tenant}/jobs
 *
 * The endpoint accepts a JSON body with pagination parameters and returns
 * structured job listing data. This is the same endpoint that the Workday
 * job board frontend uses internally.
 *
 * Note: This approach is stable and used by many open-source job aggregators.
 * If a company's Workday board returns 403 or 404, they have restricted
 * access — their config should be removed from companies.ts.
 */

import type { WorkdayCompanyConfig } from "./companies.js";

// ─── Raw API Types ────────────────────────────────────────────────────────────

export interface WorkdayJobLocation {
  descriptor: string; // e.g. "Austin, TX, USA" or "Remote, USA"
}

export interface WorkdayJobPosting {
  id: string;
  title: string;
  externalPath: string;    // Relative path: "/en-US/External_Career_Site/job/..."
  locationsText?: string;  // Formatted multi-location string
  timeType?: { descriptor: string };       // "Full time" | "Part time"
  workerSubType?: { descriptor: string };  // "Regular" | "Intern" | "Contractor"
  postedOn?: string;       // ISO date: "2024-01-15"
  startDate?: string;      // ISO date (internship start dates)
  jobDescription?: string;
  locations?: WorkdayJobLocation[];
  primaryLocation?: WorkdayJobLocation;
}

interface WorkdayApiResponse {
  total: number;
  jobPostings: WorkdayJobPosting[];
}

export interface WorkdayScrapeResult {
  company: WorkdayCompanyConfig;
  jobs: WorkdayJobPosting[];
  error?: string;
}

// ─── Request Config ───────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 20_000;
const MAX_PAGES = 20; // Safety cap: 20 pages × 100 jobs = 2000 max per company

/**
 * Build the Workday API URL for a company config.
 */
const buildWorkdayUrl = (config: WorkdayCompanyConfig): string =>
  `https://${config.subdomain}.wd${config.instance}.myworkdayjobs.com/wday/cxs/${config.tenant}/jobs`;

/**
 * Build the request body for a Workday jobs API request.
 * Workday uses offset-based pagination.
 */
const buildRequestBody = (offset: number, limit: number): string =>
  JSON.stringify({
    appliedFacets: {},
    limit,
    offset,
    searchText: "",
  });

/**
 * Fetch a single page of jobs from a Workday company board.
 */
const fetchPage = async (
  config: WorkdayCompanyConfig,
  offset: number,
  limit: number
): Promise<WorkdayApiResponse | null> => {
  const url = buildWorkdayUrl(config);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Workday requires a valid Origin/Referer header to return data
        Origin: `https://${config.subdomain}.wd${config.instance}.myworkdayjobs.com`,
        Referer: `https://${config.subdomain}.wd${config.instance}.myworkdayjobs.com/${config.tenant}`,
        "User-Agent":
          "Mozilla/5.0 (compatible; CareerForge-Bot/1.0; +https://careerforge.ai)",
      },
      body: buildRequestBody(offset, limit),
    });

    if (res.status === 403 || res.status === 401) {
      console.warn(
        `[Workday] ${config.displayName}: Access denied (HTTP ${res.status}) — board may be private`
      );
      return null;
    }

    if (!res.ok) {
      console.warn(
        `[Workday] ${config.displayName}: HTTP ${res.status} at offset ${offset} — skipping`
      );
      return null;
    }

    const data = (await res.json()) as WorkdayApiResponse;
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(
        `[Workday] ${config.displayName}: Timeout at offset ${offset}`
      );
    } else {
      console.warn(
        `[Workday] ${config.displayName}: Fetch error — ${(err as Error).message}`
      );
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Fetch ALL pages of job listings for a single Workday company.
 * Uses offset-based pagination, stopping when the API returns fewer
 * results than the requested limit or when we hit MAX_PAGES.
 */
const fetchAllJobsForCompany = async (
  config: WorkdayCompanyConfig
): Promise<WorkdayJobPosting[]> => {
  const limit = config.limit ?? 100;
  const jobs: WorkdayJobPosting[] = [];
  let offset = 0;
  let page = 0;
  let totalKnown = Infinity;

  while (offset < totalKnown && page < MAX_PAGES) {
    const data = await fetchPage(config, offset, limit);
    if (!data) break;

    if (page === 0) {
      totalKnown = data.total;
      console.log(
        `[Workday] ${config.displayName}: ${totalKnown} total jobs found`
      );
    }

    const postings = Array.isArray(data.jobPostings) ? data.jobPostings : [];
    jobs.push(...postings);
    offset += limit;
    page += 1;

    // Reached the end
    if (postings.length < limit) break;

    // Politeness delay between pages (100ms)
    await new Promise((r) => setTimeout(r, 100));
  }

  return jobs;
};

/**
 * Scrape all configured Workday companies, batching concurrent requests.
 *
 * @param companies   - Array of WorkdayCompanyConfig entries
 * @param concurrency - Parallel company fetches (default 3 — Workday is stricter)
 */
export const scrapeWorkday = async (
  companies: WorkdayCompanyConfig[],
  concurrency = 3
): Promise<WorkdayScrapeResult[]> => {
  const results: WorkdayScrapeResult[] = [];

  for (let i = 0; i < companies.length; i += concurrency) {
    const batch = companies.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (config) => {
        const jobs = await fetchAllJobsForCompany(config);
        return { company: config, jobs } satisfies WorkdayScrapeResult;
      })
    );

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
      } else {
        console.error(
          `[Workday] Batch error:`,
          (outcome.reason as Error).message
        );
      }
    }
  }

  return results;
};
