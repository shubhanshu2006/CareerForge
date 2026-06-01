/**
 * Lever Posting API scraper.
 *
 * Endpoint: GET https://api.lever.co/v0/postings/{company}?mode=json
 *
 * The Lever public posting API requires no authentication.
 * Responses are paginated with a `next` cursor; we follow pagination until
 * all pages are consumed.
 */

export interface LeverCategoryInfo {
  commitment?: string;   // e.g. "Full-time", "Part-time", "Intern"
  department?: string;   // e.g. "Engineering"
  location?: string;     // e.g. "Remote", "San Francisco, CA"
  team?: string;
}

export interface LeverRawJob {
  id: string;
  text: string;          // Job title
  hostedUrl: string;     // Application / job page URL
  applyUrl?: string;     // Direct apply URL (may differ from hostedUrl)
  categories: LeverCategoryInfo;
  description?: string;  // HTML job description
  descriptionPlain?: string;
  createdAt: number;     // Unix timestamp (ms)
  updatedAt?: number;
}

interface LeverApiResponse {
  data: LeverRawJob[];
  hasNext: boolean;
  next?: string;
}

export interface LeverScrapeResult {
  company: string;
  jobs: LeverRawJob[];
}

const LEVER_API_BASE = "https://api.lever.co/v0/postings";
const FETCH_TIMEOUT_MS = 15_000;
const MAX_PAGES = 20; // safety cap to avoid infinite loops

/**
 * Fetches all job postings for a single Lever company, following pagination.
 */
const fetchJobsForCompany = async (
  company: string
): Promise<LeverRawJob[]> => {
  const jobs: LeverRawJob[] = [];
  let nextCursor: string | undefined;
  let page = 0;

  do {
    const url = new URL(`${LEVER_API_BASE}/${company}`);
    url.searchParams.set("mode", "json");
    url.searchParams.set("limit", "100");
    if (nextCursor) {
      url.searchParams.set("offset", nextCursor);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.warn(
          `[Lever] ${company}: HTTP ${res.status} (page ${page + 1}) — skipping`
        );
        break;
      }

      const data = (await res.json()) as LeverApiResponse;
      if (Array.isArray(data.data)) {
        jobs.push(...data.data);
      }

      nextCursor = data.hasNext ? data.next : undefined;
      page += 1;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.warn(`[Lever] ${company}: timeout on page ${page + 1} — stopping`);
      } else {
        console.warn(
          `[Lever] ${company}: fetch error — ${(err as Error).message}`
        );
      }
      break;
    } finally {
      clearTimeout(timer);
    }
  } while (nextCursor && page < MAX_PAGES);

  return jobs;
};

/**
 * Scrapes all configured Lever companies concurrently (batched).
 *
 * @param companies   - Array of Lever board identifiers
 * @param concurrency - Simultaneous requests (default 5)
 */
export const scrapeLever = async (
  companies: string[],
  concurrency = 5
): Promise<LeverScrapeResult[]> => {
  const results: LeverScrapeResult[] = [];

  for (let i = 0; i < companies.length; i += concurrency) {
    const batch = companies.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (company) => {
        const jobs = await fetchJobsForCompany(company);
        return { company, jobs } satisfies LeverScrapeResult;
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
