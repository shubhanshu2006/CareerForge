const FETCH_TIMEOUT_MS = 15_000;
const RESULTS_PER_PAGE = 100;

export interface SmartRecruitersRawJob {
  id: string;
  title: string;
  applyUrl: string;
  location?: string;
  department?: string;
  isRemote: boolean;
  postedAt?: string;
  company: string;
}

export interface SmartRecruitersScrapeResult {
  company: string;
  jobs: SmartRecruitersRawJob[];
}

const isIndia = (location = ""): boolean => {
  const indiaRegex =
    /\b(india|bengaluru|bangalore|hyderabad|mumbai|pune|chennai|delhi|gurugram|gurgaon|noida|kolkata|ahmedabad|blr|hyd|mum)\b/i;
  return indiaRegex.test(location);
};

const fetchPage = async (
  slug: string,
  offset: number,
): Promise<{ jobs: SmartRecruitersRawJob[]; total: number }> => {
  const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings?limit=${RESULTS_PER_PAGE}&offset=${offset}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(`[SmartRecruiters] ${slug}: HTTP ${res.status} at offset ${offset}`);
      return { jobs: [], total: 0 };
    }

    const data = (await res.json()) as {
      content?: Array<{
        id: string;
        name?: string;
        location?: { city?: string; region?: string; country?: string; remote?: boolean };
        department?: { label?: string };
        releasedDate?: string;
      }>;
      totalFound?: number;
    };

    const items = data.content ?? [];
    const jobs: SmartRecruitersRawJob[] = items.map((j) => {
      const locParts = [j.location?.city, j.location?.region, j.location?.country].filter(Boolean);
      const location = locParts.join(", ");
      return {
        id: j.id,
        title: j.name ?? "",
        applyUrl: `https://jobs.smartrecruiters.com/${encodeURIComponent(slug)}/${j.id}`,
        location,
        department: j.department?.label,
        isRemote: !!j.location?.remote,
        postedAt: j.releasedDate,
        company: slug,
      };
    });

    return { jobs, total: data.totalFound ?? 0 };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[SmartRecruiters] ${slug}: timeout at offset ${offset}`);
    } else {
      console.warn(`[SmartRecruiters] ${slug}: fetch error — ${(err as Error).message}`);
    }
    return { jobs: [], total: 0 };
  } finally {
    clearTimeout(timer);
  }
};

const scrapeCompany = async (slug: string): Promise<SmartRecruitersRawJob[]> => {
  const all: SmartRecruitersRawJob[] = [];
  let offset = 0;

  const first = await fetchPage(slug, 0);
  const indiaJobs = first.jobs.filter((j) => j.isRemote || isIndia(j.location ?? ""));
  all.push(...indiaJobs);

  const total = first.total;
  offset += RESULTS_PER_PAGE;

  while (offset < total) {
    const page = await fetchPage(slug, offset);
    if (page.jobs.length === 0) break;
    const filtered = page.jobs.filter((j) => j.isRemote || isIndia(j.location ?? ""));
    all.push(...filtered);
    offset += RESULTS_PER_PAGE;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`[SmartRecruiters] ${slug}: ${all.length} India/remote jobs`);
  return all;
};

export const scrapeSmartRecruiters = async (
  slugs: string[],
): Promise<SmartRecruitersScrapeResult[]> => {
  const results: SmartRecruitersScrapeResult[] = [];

  for (const slug of slugs) {
    try {
      const jobs = await scrapeCompany(slug);
      results.push({ company: slug, jobs });
    } catch (err) {
      console.error(`[SmartRecruiters] ${slug}: fatal — ${(err as Error).message}`);
      results.push({ company: slug, jobs: [] });
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
};
