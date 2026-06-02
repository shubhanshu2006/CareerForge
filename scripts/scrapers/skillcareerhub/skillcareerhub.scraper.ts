import type { SkillCareerHubSourceConfig } from "./companies.js";

export interface SkillCareerHubRawJob {
  id: string;
  title: string;
  link: string;
  company?: string;
  location?: string;
  description?: string;
  postedAt?: string;
  employmentType?: string;
}

export interface SkillCareerHubScrapeResult {
  company: string;
  jobs: SkillCareerHubRawJob[];
}

const FETCH_TIMEOUT_MS = 15_000;

const stripHtml = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || undefined;
};

const toText = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (value && typeof value === "object") {
    const rendered = (value as { rendered?: unknown }).rendered;
    return typeof rendered === "string" ? stripHtml(rendered) : undefined;
  }
  return undefined;
};

const parseWpItem = (item: Record<string, unknown>): SkillCareerHubRawJob | null => {
  const id = item.id;
  const link = toText(item.link);
  const title = toText(item.title);
  const description = toText(item.excerpt) ?? toText(item.content);

  if (!id || !title || !link) return null;

  return {
    id: String(id),
    title,
    link,
    description,
    postedAt: toText(item.date_gmt) ?? toText(item.date),
  };
};

const parseGenericItem = (item: Record<string, unknown>): SkillCareerHubRawJob | null => {
  const id = item.id ?? item.jobId ?? item.slug;
  const title = toText(item.title) ?? toText(item.job_title) ?? toText(item.name);
  const link = toText(item.link) ?? toText(item.url) ?? toText(item.applyUrl);
  if (!id || !title || !link) return null;

  return {
    id: String(id),
    title,
    link,
    company: toText(item.company) ?? toText(item.companyName),
    location: toText(item.location),
    description: toText(item.description),
    postedAt: toText(item.postedAt) ?? toText(item.created_at),
    employmentType: toText(item.employmentType) ?? toText(item.contract_type),
  };
};

const parseItems = (payload: unknown): SkillCareerHubRawJob[] => {
  if (Array.isArray(payload)) {
    const out: SkillCareerHubRawJob[] = [];
    for (const row of payload) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const parsed = parseWpItem(item) ?? parseGenericItem(item);
      if (parsed) out.push(parsed);
    }
    return out;
  }

  if (payload && typeof payload === "object") {
    const root = payload as Record<string, unknown>;
    const rows = root.items ?? root.results ?? root.jobs ?? root.data;
    return parseItems(rows);
  }

  return [];
};

const fetchPage = async (
  cfg: SkillCareerHubSourceConfig,
  page: number,
): Promise<SkillCareerHubRawJob[]> => {
  const url = new URL(cfg.endpoint);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(cfg.perPage ?? 50));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(
        `[SkillCareerHub] ${cfg.label}: HTTP ${res.status} on page ${page} — stopping source`,
      );
      return [];
    }

    const data = (await res.json()) as unknown;
    return parseItems(data);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[SkillCareerHub] ${cfg.label}: timeout on page ${page}`);
    } else {
      console.warn(
        `[SkillCareerHub] ${cfg.label}: fetch error on page ${page} — ${(err as Error).message}`,
      );
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
};

const fetchJobsForSource = async (
  cfg: SkillCareerHubSourceConfig,
): Promise<SkillCareerHubRawJob[]> => {
  const jobs: SkillCareerHubRawJob[] = [];
  const maxPages = Math.max(1, cfg.maxPages ?? 2);

  for (let page = 1; page <= maxPages; page += 1) {
    const pageJobs = await fetchPage(cfg, page);
    if (pageJobs.length === 0) break;
    jobs.push(...pageJobs);
  }

  return jobs;
};

export const scrapeSkillCareerHub = async (
  sources: SkillCareerHubSourceConfig[],
  concurrency = 2,
): Promise<SkillCareerHubScrapeResult[]> => {
  const results: SkillCareerHubScrapeResult[] = [];

  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (cfg) => {
        const jobs = await fetchJobsForSource(cfg);
        return { company: cfg.label, jobs } satisfies SkillCareerHubScrapeResult;
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
