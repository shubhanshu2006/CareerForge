/**
 * Greenhouse Jobs Board API scraper.
 *
 * Endpoint: GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
 *
 * The `?content=true` parameter includes the full job description HTML in the
 * response, which we use for remote detection and employment-type inference.
 */

export interface GreenhouseLocation {
  name: string;
}

export interface GreenhouseJobContent {
  /** HTML job description */
  content?: string;
  /** Greenhouse internal departments */
  departments?: Array<{ name: string }>;
}

export interface GreenhouseRawJob {
  id: number;
  title: string;
  absolute_url: string;
  location: GreenhouseLocation;
  updated_at: string;
  // Present when ?content=true
  content?: string;
  departments?: Array<{ id: number; name: string }>;
  metadata?: Array<{ name: string; value: string | null }>;
}

interface GreenhouseApiResponse {
  jobs: GreenhouseRawJob[];
  meta: {
    total: number;
  };
}

export interface GreenhouseScrapeResult {
  company: string;
  jobs: GreenhouseRawJob[];
}

const GREENHOUSE_API_BASE =
  "https://boards-api.greenhouse.io/v1/boards";

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetches raw jobs for a single company slug.
 * Returns an empty array on any network / HTTP error so the pipeline
 * continues with remaining companies.
 */
const fetchJobsForCompany = async (
  slug: string
): Promise<GreenhouseRawJob[]> => {
  const url = `${GREENHOUSE_API_BASE}/${slug}/jobs?content=true`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(
        `[Greenhouse] ${slug}: HTTP ${res.status} — skipping`
      );
      return [];
    }

    const data = (await res.json()) as GreenhouseApiResponse;
    return Array.isArray(data.jobs) ? data.jobs : [];
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[Greenhouse] ${slug}: request timed out — skipping`);
    } else {
      console.warn(
        `[Greenhouse] ${slug}: fetch error — ${(err as Error).message}`
      );
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Scrapes all configured Greenhouse companies concurrently (batched to
 * avoid hammering the API) and returns per-company results.
 *
 * @param companies - Array of Greenhouse board slugs
 * @param concurrency - Number of simultaneous requests (default 5)
 */
export const scrapeGreenhouse = async (
  companies: string[],
  concurrency = 12
): Promise<GreenhouseScrapeResult[]> => {
  const results: GreenhouseScrapeResult[] = [];

  // Process in batches to stay polite to the upstream API
  for (let i = 0; i < companies.length; i += concurrency) {
    const batch = companies.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (slug) => {
        const jobs = await fetchJobsForCompany(slug);
        return { company: slug, jobs } satisfies GreenhouseScrapeResult;
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
