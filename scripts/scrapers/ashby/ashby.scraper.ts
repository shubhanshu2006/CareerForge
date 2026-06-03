/**
 * Ashby Job Board Posting API scraper.
 *
 * Endpoint: GET https://api.ashbyhq.com/posting-api/job-board/{companyIdentifier}
 *
 * No authentication required for public job boards.
 * Returns all active postings in a single response (no pagination).
 */

export interface AshbyLocation {
  locationStr?: string;   // Formatted location string, e.g. "Remote (US)"
  isRemote?: boolean;
  timezone?: string;
}

export interface AshbyDepartment {
  id: string;
  name: string;
  parentId?: string;
}

export interface AshbyCompensationTier {
  minValue?: number;
  maxValue?: number;
  currency?: string;
  interval?: string; // "YEARLY" | "MONTHLY" | "HOURLY"
}

export interface AshbyRawJob {
  id: string;
  title: string;
  teamName?: string;
  departmentName?: string;
  locationName?: string;
  isRemote?: boolean;
  applyUrl: string;
  jobUrl: string;
  /** ISO 8601 string */
  publishedDate?: string;
  /** ISO 8601 string */
  updatedAt?: string;
  employmentType?: string;  // e.g. "FullTime", "PartTime", "Contractor", "Intern"
  description?: string;
  descriptionHtml?: string;
  compensation?: AshbyCompensationTier;
  /** Sometimes present as `location` object */
  location?: AshbyLocation;
}

interface AshbyApiResponse {
  jobs: AshbyRawJob[];
}

export interface AshbyScrapeResult {
  company: string;
  jobs: AshbyRawJob[];
}

const ASHBY_API_BASE =
  "https://api.ashbyhq.com/posting-api/job-board";
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetches all active job postings for a single Ashby company identifier.
 */
const fetchJobsForCompany = async (
  identifier: string
): Promise<AshbyRawJob[]> => {
  const url = `${ASHBY_API_BASE}/${identifier}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(
        `[Ashby] ${identifier}: HTTP ${res.status} — skipping`
      );
      return [];
    }

    const data = (await res.json()) as AshbyApiResponse;
    return Array.isArray(data.jobs) ? data.jobs : [];
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[Ashby] ${identifier}: request timed out — skipping`);
    } else {
      console.warn(
        `[Ashby] ${identifier}: fetch error — ${(err as Error).message}`
      );
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Scrapes all configured Ashby companies concurrently (batched).
 *
 * @param companies   - Array of Ashby company identifiers
 * @param concurrency - Simultaneous requests (default 5)
 */
export const scrapeAshby = async (
  companies: string[],
  concurrency = 12
): Promise<AshbyScrapeResult[]> => {
  const results: AshbyScrapeResult[] = [];

  for (let i = 0; i < companies.length; i += concurrency) {
    const batch = companies.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (company) => {
        const jobs = await fetchJobsForCompany(company);
        return { company, jobs } satisfies AshbyScrapeResult;
      })
    );

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
      }
    }
  }

  return results;
};
