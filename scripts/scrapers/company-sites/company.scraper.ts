/**
 * Company Sites Playwright Scraper.
 *
 * Uses Playwright (Chromium) to visit company career pages that do NOT use
 * standardized ATS APIs (Greenhouse/Lever/Ashby/Workday).
 *
 * Supported companies:
 *   - OpenAI     → https://openai.com/careers/search
 *   - Anthropic  → https://www.anthropic.com/careers#open-roles
 *   - Perplexity → https://www.perplexity.ai/careers
 *
 * Architecture:
 *   1. Launch headless Chromium
 *   2. Navigate to careers page (wait for JS to render)
 *   3. Extract job listings using configurable CSS selectors
 *   4. Return structured raw job data for normalization
 *
 * Each company has a dedicated scraper function to handle company-specific
 * DOM structures, infinite scroll, and pagination patterns.
 */

import { chromium, type Browser, type Page } from "playwright";
import type { CompanySiteConfig } from "./companies.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanySiteRawJob {
  title: string;
  link: string;
  location?: string;
  department?: string;
  company: string;
}

export interface CompanySiteScrapeResult {
  company: string;
  careersUrl: string;
  jobs: CompanySiteRawJob[];
  error?: string;
}

// ─── Browser Management ───────────────────────────────────────────────────────

const BROWSER_TIMEOUT_MS = 30_000;
const PAGE_LOAD_TIMEOUT_MS = 20_000;

let sharedBrowser: Browser | null = null;

const getBrowser = async (): Promise<Browser> => {
  if (sharedBrowser && sharedBrowser.isConnected()) return sharedBrowser;

  sharedBrowser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
    ],
  });

  return sharedBrowser;
};

export const closeBrowser = async (): Promise<void> => {
  if (sharedBrowser) {
    await sharedBrowser.close();
    sharedBrowser = null;
  }
};

// ─── Utility Helpers ──────────────────────────────────────────────────────────

/**
 * Resolve a potentially relative URL to an absolute URL.
 */
const resolveUrl = (href: string, baseUrl: string): string => {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) {
    const base = new URL(baseUrl);
    return `${base.protocol}//${base.host}${href}`;
  }
  return href;
};

/**
 * Create a new browser page with standard settings to avoid bot detection.
 */
const createPage = async (browser: Browser): Promise<Page> => {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    timezoneId: "America/New_York",
  });
  return context.newPage();
};

// ─── OpenAI Scraper ───────────────────────────────────────────────────────────

const scrapeOpenAI = async (
  config: CompanySiteConfig,
  browser: Browser
): Promise<CompanySiteRawJob[]> => {
  const page = await createPage(browser);
  const jobs: CompanySiteRawJob[] = [];

  try {
    console.log(`[CompanySites] OpenAI: Navigating to ${config.careersUrl}`);
    await page.goto(config.careersUrl, {
      waitUntil: "networkidle",
      timeout: PAGE_LOAD_TIMEOUT_MS,
    });

    // OpenAI's job board uses React — wait for content to render
    await page.waitForTimeout(3000);

    // Try multiple selector strategies for resilience
    const jobElements = await page
      .locator(
        '[data-testid="jobs-list-item"], .jobs-list-item, [class*="JobCard"], [class*="job-card"], li[class*="job"]'
      )
      .all();

    if (jobElements.length === 0) {
      // Fallback: try to find any anchors on the page with job-like paths
      const allLinks = await page.locator('a[href*="/careers/"]').all();
      for (const link of allLinks) {
        const href = await link.getAttribute("href");
        const text = (await link.textContent())?.trim();
        if (href && text && text.length > 5 && text.length < 200) {
          jobs.push({
            title: text,
            link: resolveUrl(href, config.baseUrl ?? config.careersUrl),
            company: config.name,
          });
        }
      }
    } else {
      for (const el of jobElements) {
        const title = (
          await el
            .locator('h3, h2, h4, [class*="title"], [class*="name"]')
            .first()
            .textContent()
            .catch(() => null)
        )?.trim();

        const href = await el
          .locator("a")
          .first()
          .getAttribute("href")
          .catch(() => null);

        const location = (
          await el
            .locator('[class*="location"], [class*="office"]')
            .first()
            .textContent()
            .catch(() => null)
        )?.trim();

        const department = (
          await el
            .locator('[class*="team"], [class*="department"]')
            .first()
            .textContent()
            .catch(() => null)
        )?.trim();

        if (title && href) {
          jobs.push({
            title,
            link: resolveUrl(href, config.baseUrl ?? config.careersUrl),
            location,
            department,
            company: config.name,
          });
        }
      }
    }

    console.log(`[CompanySites] OpenAI: Found ${jobs.length} jobs`);
  } catch (err) {
    console.warn(
      `[CompanySites] OpenAI: Error — ${(err as Error).message}`
    );
  } finally {
    await page.context().close();
  }

  return jobs;
};

// ─── Anthropic Scraper ────────────────────────────────────────────────────────

const scrapeAnthropic = async (
  config: CompanySiteConfig,
  browser: Browser
): Promise<CompanySiteRawJob[]> => {
  const page = await createPage(browser);
  const jobs: CompanySiteRawJob[] = [];

  try {
    console.log(`[CompanySites] Anthropic: Navigating to ${config.careersUrl}`);
    await page.goto(config.careersUrl, {
      waitUntil: "networkidle",
      timeout: PAGE_LOAD_TIMEOUT_MS,
    });
    await page.waitForTimeout(2000);

    // Anthropic uses Next.js — job listings are in sections
    // Try their Greenhouse board link which is embedded in the page
    const greenhouseLinks = await page
      .locator('a[href*="boards.greenhouse.io"], a[href*="greenhouse.io/job"]')
      .all();

    if (greenhouseLinks.length > 0) {
      for (const link of greenhouseLinks) {
        const href = await link.getAttribute("href");
        const text = (await link.textContent())?.trim();
        const parent = link.locator("..").locator("..");
        const location = (
          await parent
            .locator('[class*="location"]')
            .first()
            .textContent()
            .catch(() => null)
        )?.trim();

        if (href && text) {
          jobs.push({
            title: text,
            link: href,
            location,
            company: config.name,
          });
        }
      }
    } else {
      // Generic extraction
      const jobItems = await page
        .locator(
          '[class*="job"], [class*="opening"], [class*="role"], [class*="position"]'
        )
        .all();

      for (const item of jobItems) {
        const title = (
          await item
            .locator("h2, h3, h4, strong")
            .first()
            .textContent()
            .catch(() => null)
        )?.trim();

        const href = await item
          .locator("a")
          .first()
          .getAttribute("href")
          .catch(() => null);

        const location = (
          await item
            .locator('[class*="location"]')
            .first()
            .textContent()
            .catch(() => null)
        )?.trim();

        if (title && href) {
          jobs.push({
            title,
            link: resolveUrl(href, config.baseUrl ?? config.careersUrl),
            location,
            company: config.name,
          });
        }
      }
    }

    console.log(`[CompanySites] Anthropic: Found ${jobs.length} jobs`);
  } catch (err) {
    console.warn(
      `[CompanySites] Anthropic: Error — ${(err as Error).message}`
    );
  } finally {
    await page.context().close();
  }

  return jobs;
};

// ─── Perplexity Scraper ───────────────────────────────────────────────────────

const scrapePerplexity = async (
  config: CompanySiteConfig,
  browser: Browser
): Promise<CompanySiteRawJob[]> => {
  const page = await createPage(browser);
  const jobs: CompanySiteRawJob[] = [];

  try {
    console.log(`[CompanySites] Perplexity: Navigating to ${config.careersUrl}`);
    await page.goto(config.careersUrl, {
      waitUntil: "networkidle",
      timeout: PAGE_LOAD_TIMEOUT_MS,
    });
    await page.waitForTimeout(3000);

    // Perplexity may redirect to Ashby or another ATS
    const currentUrl = page.url();
    if (currentUrl.includes("ashbyhq.com") || currentUrl.includes("greenhouse.io")) {
      console.log(`[CompanySites] Perplexity: Redirected to ATS at ${currentUrl}`);
      // Already handled by Ashby/Greenhouse scrapers — return empty
      return [];
    }

    // Generic extraction from careers page
    const jobItems = await page
      .locator(
        'a[href*="/job"], a[href*="/career"], [class*="role"], [class*="position"], [class*="opening"]'
      )
      .all();

    const seen = new Set<string>();
    for (const item of jobItems.slice(0, 100)) {
      const href = await item.getAttribute("href").catch(() => null);
      const text = (await item.textContent())?.trim();

      if (!href || !text || text.length < 5 || seen.has(href)) continue;
      seen.add(href);

      // Filter out nav links and generic anchors
      const isJobLink =
        href.includes("/job") ||
        href.includes("/role") ||
        href.includes("/career") ||
        href.includes("/opening");

      if (isJobLink) {
        jobs.push({
          title: text,
          link: resolveUrl(href, config.baseUrl ?? config.careersUrl),
          company: config.name,
        });
      }
    }

    console.log(`[CompanySites] Perplexity: Found ${jobs.length} jobs`);
  } catch (err) {
    console.warn(
      `[CompanySites] Perplexity: Error — ${(err as Error).message}`
    );
  } finally {
    await page.context().close();
  }

  return jobs;
};

// ─── Generic Scraper ──────────────────────────────────────────────────────────

const scrapeGeneric = async (
  config: CompanySiteConfig,
  browser: Browser
): Promise<CompanySiteRawJob[]> => {
  const page = await createPage(browser);
  const jobs: CompanySiteRawJob[] = [];

  try {
    await page.goto(config.careersUrl, {
      waitUntil: "networkidle",
      timeout: PAGE_LOAD_TIMEOUT_MS,
    });
    await page.waitForTimeout(2000);

    const items = await page.locator(config.selectors.jobItem).all();

    for (const item of items) {
      const title = (
        await item
          .locator(config.selectors.title)
          .first()
          .textContent()
          .catch(() => null)
      )?.trim();

      const href = await item
        .locator(config.selectors.link)
        .first()
        .getAttribute("href")
        .catch(() => null);

      const location = config.selectors.location
        ? (
            await item
              .locator(config.selectors.location)
              .first()
              .textContent()
              .catch(() => null)
          )?.trim()
        : undefined;

      const department = config.selectors.department
        ? (
            await item
              .locator(config.selectors.department)
              .first()
              .textContent()
              .catch(() => null)
          )?.trim()
        : undefined;

      if (title && href) {
        jobs.push({
          title,
          link: resolveUrl(href, config.baseUrl ?? config.careersUrl),
          location,
          department,
          company: config.name,
        });
      }
    }
  } catch (err) {
    console.warn(
      `[CompanySites] ${config.name}: Generic scraper error — ${(err as Error).message}`
    );
  } finally {
    await page.context().close();
  }

  return jobs;
};

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const scraperMap: Record<
  string,
  (config: CompanySiteConfig, browser: Browser) => Promise<CompanySiteRawJob[]>
> = {
  openai: scrapeOpenAI,
  anthropic: scrapeAnthropic,
  perplexity: scrapePerplexity,
  generic: scrapeGeneric,
};

/**
 * Scrape a single company careers page using the appropriate scraper.
 */
const scrapeCompanySite = async (
  config: CompanySiteConfig,
  browser: Browser
): Promise<CompanySiteScrapeResult> => {
  const scraper = scraperMap[config.type] ?? scrapeGeneric;
  try {
    const jobs = await scraper(config, browser);
    return { company: config.name, careersUrl: config.careersUrl, jobs };
  } catch (err) {
    const error = (err as Error).message;
    console.error(`[CompanySites] ${config.name}: Fatal error — ${error}`);
    return { company: config.name, careersUrl: config.careersUrl, jobs: [], error };
  }
};

/**
 * Scrape all configured company career sites sequentially.
 *
 * Company sites are scraped one at a time (no concurrency) to:
 *   1. Avoid overloading company servers
 *   2. Prevent Playwright from hitting memory limits
 *
 * @param configs - Array of CompanySiteConfig entries
 */
export const scrapeCompanySites = async (
  configs: CompanySiteConfig[]
): Promise<CompanySiteScrapeResult[]> => {
  const browser = await getBrowser();
  const results: CompanySiteScrapeResult[] = [];

  for (const config of configs) {
    const result = await scrapeCompanySite(config, browser);
    results.push(result);
    // Polite delay between companies
    await new Promise((r) => setTimeout(r, 1000));
  }

  await closeBrowser();
  return results;
};
