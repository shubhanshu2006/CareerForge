import type { AdzunaSearchConfig } from "./companies.js";

export interface AdzunaRawJob {
  id: string;
  title: string;
  redirect_url: string;
  created?: string;
  description?: string;
  location?: { display_name?: string };
  company?: { display_name?: string };
  category?: { label?: string };
  contract_time?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
}

interface AdzunaApiResponse {
  results: AdzunaRawJob[];
  count?: number;
}

export interface AdzunaScrapeResult {
  company: string;
  jobs: AdzunaRawJob[];
}

const ADZUNA_API_BASE = "https://api.adzuna.com/v1/api/jobs";
const FETCH_TIMEOUT_MS = 15_000;

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`[Adzuna] Missing required env var: ${key}`);
  }
  return value;
};

const fetchPage = async (
  cfg: AdzunaSearchConfig,
  page: number,
  country: string,
  appId: string,
  appKey: string,
): Promise<AdzunaRawJob[]> => {
  const url = new URL(`${ADZUNA_API_BASE}/${country}/search/${page}`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", String(cfg.resultsPerPage ?? 50));
  url.searchParams.set("what", cfg.what);
  if (cfg.where) url.searchParams.set("where", cfg.where);
  if (cfg.category) url.searchParams.set("category", cfg.category);
  url.searchParams.set("content-type", "application/json");
  url.searchParams.set("sort_by", "date");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(
        `[Adzuna] ${cfg.label}: HTTP ${res.status} on page ${page} — stopping query`,
      );
      return [];
    }

    const data = (await res.json()) as AdzunaApiResponse;
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[Adzuna] ${cfg.label}: timeout on page ${page} — stopping query`);
    } else {
      console.warn(
        `[Adzuna] ${cfg.label}: fetch error on page ${page} — ${(err as Error).message}`,
      );
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
};

const fetchJobsForSearch = async (
  cfg: AdzunaSearchConfig,
  country: string,
  appId: string,
  appKey: string,
): Promise<AdzunaRawJob[]> => {
  const jobs: AdzunaRawJob[] = [];
  const maxPages = Math.max(1, cfg.maxPages ?? 2);

  for (let page = 1; page <= maxPages; page += 1) {
    const pageJobs = await fetchPage(cfg, page, country, appId, appKey);
    if (pageJobs.length === 0) break;
    jobs.push(...pageJobs);
  }

  return jobs;
};

export const scrapeAdzuna = async (
  searches: AdzunaSearchConfig[],
  concurrency = 2,
): Promise<AdzunaScrapeResult[]> => {
  const appId = getRequiredEnv("ADZUNA_APP_ID");
  const appKey = getRequiredEnv("ADZUNA_APP_KEY");
  const country = process.env.ADZUNA_COUNTRY?.trim() || "in";

  const results: AdzunaScrapeResult[] = [];

  for (let i = 0; i < searches.length; i += concurrency) {
    const batch = searches.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (cfg) => {
        const jobs = await fetchJobsForSearch(cfg, country, appId, appKey);
        return { company: cfg.label, jobs } satisfies AdzunaScrapeResult;
      }),
    );

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
      }
    }
  }

  return results;
};
