/**
 * Unified Job Ingestion Service (scripts layer).
 *
 * Active pipelines: Greenhouse + Ashby + CompanySites + Adzuna + SmartRecruiters
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

// ─── Greenhouse ───────────────────────────────────────────────────────────────
import { greenhouseCompanies } from "../scrapers/greenhouse/companies.js";
import { scrapeGreenhouse } from "../scrapers/greenhouse/greenhouse.scraper.js";
import { normalizeGreenhouseJobs } from "../normalizers/greenhouse.normalizer.js";

// ─── Ashby ────────────────────────────────────────────────────────────────────
import { ashbyCompanies } from "../scrapers/ashby/companies.js";
import { scrapeAshby } from "../scrapers/ashby/ashby.scraper.js";
import { normalizeAshbyJobs } from "../normalizers/ashby.normalizer.js";

// ─── Company Sites (Playwright) ───────────────────────────────────────────────
import { companySites } from "../scrapers/company-sites/companies.js";
import { scrapeCompanySites } from "../scrapers/company-sites/company.scraper.js";
import { normalizeCompanySiteJobs } from "../normalizers/company-site.normalizer.js";

// ─── SmartRecruiters ──────────────────────────────────────────────────────────
import { smartRecruitersCompanies } from "../scrapers/smartrecruiters/companies.js";
import { scrapeSmartRecruiters } from "../scrapers/smartrecruiters/smartrecruiters.scraper.js";
import { normalizeSmartRecruitersJobs } from "../normalizers/smartrecruiters.normalizer.js";

// ─── Adzuna ───────────────────────────────────────────────────────────────────
import { adzunaSearches } from "../scrapers/adzuna/companies.js";
import { scrapeAdzuna } from "../scrapers/adzuna/adzuna.scraper.js";
import { normalizeAdzunaJobs } from "../normalizers/adzuna.normalizer.js";

// ─── Deduplication ────────────────────────────────────────────────────────────
import { deduplicateJobs } from "../deduplication/deduplication.service.js";

// ─── Ingestion + Metrics ──────────────────────────────────────────────────────
import type { NormalizedJob } from "../types/normalized-job.js";
import { ingestJobs } from "../../backend/src/services/jobIngestion.service.js";
import { PipelineMetrics } from "../monitoring/pipeline-metrics.js";

export interface PipelineResult {
  fetched: number;
  inserted: number;
  skipped: number;
  errors: number;
  alertsGenerated: number;
  emailsEnqueued: number;
}

/**
 * Maps a NormalizedJob into the RawJobInput shape expected by ingestJobs().
 */
const toRawJobInput = (job: NormalizedJob) => ({
  source:
    job.source as import("../../backend/src/services/jobIngestion.service.js").RawJobInput["source"],
  company: job.company,
  title: job.title,
  location: job.location ?? null,
  department: job.department ?? null,
  employmentType: (job.employmentType ??
    null) as import("../../backend/src/services/jobIngestion.service.js").RawJobInput["employmentType"],
  description: job.description ?? null,
  applyUrl: job.applyUrl,
  postedAt: job.postedAt ?? null,
  isRemote: job.isRemote,
  experienceLevel: (job.experienceLevel ??
    null) as import("../../backend/src/services/jobIngestion.service.js").RawJobInput["experienceLevel"],
  minSalary: job.minSalary ?? null,
  maxSalary: job.maxSalary ?? null,
  externalId: job.sourceJobId ?? null,
  companyLogo: job.companyLogo ?? null,
});

// ─── Shared dedup + ingest helper ────────────────────────────────────────────

/**
 * Runs the deduplication → ingest → metrics recording pipeline for a batch
 * of normalized jobs. Shared by all 5 source-specific pipeline functions.
 *
 * Deduplication is two-stage (implemented in deduplication.service.ts):
 *   1. Exact source + sourceJobId match   → definitive duplicate
 *   2. dedupeKey (SHA-256 company|title|location) → content duplicate
 *
 * The backend ingestJobs() performs a secondary dedupeKey check as a safety
 * net for race conditions when parallel pipelines run simultaneously.
 */
const dedupeAndIngest = async (
  label: string,
  normalized: NormalizedJob[],
  metrics: PipelineMetrics,
): Promise<PipelineResult> => {
  // Stage 1 — pre-filter: check the DB before touching the backend
  const { toInsert, skipped: preFilterSkipped } =
    await deduplicateJobs(normalized);

  if (preFilterSkipped > 0) {
    console.log(
      `[${label}] Pre-filter: ${normalized.length} normalized, ` +
        `${preFilterSkipped} already in DB, ${toInsert.length} to insert`,
    );
  }
  metrics.recordSkipped(preFilterSkipped);

  // Stage 2 — ingest: write new jobs, match users, enqueue emails
  const ingestion = await ingestJobs(toInsert.map(toRawJobInput));
  metrics.recordInserted(ingestion.created);
  metrics.recordSkipped(ingestion.skipped); // race-condition skips (belt-and-suspenders)
  metrics.recordFailed(ingestion.errors.length);
  metrics.recordAlerts(ingestion.alertsGenerated);
  metrics.recordEmailsEnqueued(ingestion.emailsEnqueued);

  return {
    fetched: normalized.length,
    inserted: ingestion.created,
    skipped: preFilterSkipped + ingestion.skipped,
    errors: ingestion.errors.length,
    alertsGenerated: ingestion.alertsGenerated,
    emailsEnqueued: ingestion.emailsEnqueued,
  };
};

// ─── Individual Pipelines ─────────────────────────────────────────────────────

export const runGreenhousePipeline = async (): Promise<PipelineResult> => {
  const metrics = new PipelineMetrics("GREENHOUSE");
  console.log("[Greenhouse] Starting scrape...");

  const results = await scrapeGreenhouse(greenhouseCompanies);
  const normalized: NormalizedJob[] = [];

  for (const { company, jobs } of results) {
    const n = normalizeGreenhouseJobs(jobs, company);
    console.log(
      `[Greenhouse] ${company}: ${jobs.length} raw → ${n.length} normalized`,
    );
    metrics.recordFetched(company, n.length);
    normalized.push(...n);
  }

  const result = await dedupeAndIngest("Greenhouse", normalized, metrics);
  await metrics.flush();
  return result;
};

export const runAshbyPipeline = async (): Promise<PipelineResult> => {
  const metrics = new PipelineMetrics("ASHBY");
  console.log("[Ashby] Starting scrape...");

  const results = await scrapeAshby(ashbyCompanies);
  const normalized: NormalizedJob[] = [];

  for (const { company, jobs } of results) {
    const n = normalizeAshbyJobs(jobs, company);
    console.log(
      `[Ashby] ${company}: ${jobs.length} raw → ${n.length} normalized`,
    );
    metrics.recordFetched(company, n.length);
    normalized.push(...n);
  }

  const result = await dedupeAndIngest("Ashby", normalized, metrics);
  await metrics.flush();
  return result;
};

export const runCompanySitesPipeline = async (): Promise<PipelineResult> => {
  const metrics = new PipelineMetrics("COMPANY_WEBSITE");
  console.log("[CompanySites] Starting Playwright scrape...");

  const results = await scrapeCompanySites(companySites);
  const normalized: NormalizedJob[] = [];

  for (const result of results) {
    const n = normalizeCompanySiteJobs(result.jobs);
    console.log(
      `[CompanySites] ${result.company}: ${result.jobs.length} raw → ${n.length} normalized`,
    );
    metrics.recordFetched(result.company, n.length);
    if (result.error) {
      metrics.recordError(result.company, result.error);
    }
    normalized.push(...n);
  }

  const result = await dedupeAndIngest("CompanySites", normalized, metrics);
  await metrics.flush();
  return result;
};

export const runAdzunaPipeline = async (): Promise<PipelineResult> => {
  const metrics = new PipelineMetrics("ADZUNA");
  console.log("[Adzuna] Starting scrape...");

  const results = await scrapeAdzuna(adzunaSearches);
  const normalized: NormalizedJob[] = [];

  for (const { company, jobs } of results) {
    const n = normalizeAdzunaJobs(jobs);
    console.log(`[Adzuna] ${company}: ${jobs.length} raw → ${n.length} normalized`);
    metrics.recordFetched(company, n.length);
    normalized.push(...n);
  }

  const result = await dedupeAndIngest("Adzuna", normalized, metrics);
  await metrics.flush();
  return result;
};

export const runSmartRecruitersPipeline = async (): Promise<PipelineResult> => {
  const metrics = new PipelineMetrics("OTHER");
  console.log("[SmartRecruiters] Starting scrape...");

  const results = await scrapeSmartRecruiters(smartRecruitersCompanies);
  const normalized: NormalizedJob[] = [];

  for (const { company, jobs } of results) {
    const n = normalizeSmartRecruitersJobs(jobs);
    console.log(`[SmartRecruiters] ${company}: ${jobs.length} raw → ${n.length} normalized`);
    metrics.recordFetched(company, n.length);
    normalized.push(...n);
  }

  const result = await dedupeAndIngest("SmartRecruiters", normalized, metrics);
  await metrics.flush();
  return result;
};

// ─── Unified Runner ───────────────────────────────────────────────────────────

/**
 * Active pipelines: Greenhouse + Ashby + Adzuna + CompanySites + SmartRecruiters
 */
export const runAllPipelines = async (): Promise<PipelineResult> => {
  const metrics = new PipelineMetrics("ALL");

  // API-based scrapers run concurrently
  const [gh, ab, az] = await Promise.allSettled([
    runGreenhousePipeline(),
    runAshbyPipeline(),
    runAdzunaPipeline(),
  ]);

  // CompanySites and SmartRecruiters run after (they're heavier)
  const [cs, sr] = await Promise.allSettled([
    runCompanySitesPipeline(),
    runSmartRecruitersPipeline(),
  ]);

  const aggregate: PipelineResult = {
    fetched: 0, inserted: 0, skipped: 0, errors: 0, alertsGenerated: 0, emailsEnqueued: 0,
  };

  const merge = (label: string, result: PipelineResult) => {
    aggregate.fetched += result.fetched;
    aggregate.inserted += result.inserted;
    aggregate.skipped += result.skipped;
    aggregate.errors += result.errors;
    aggregate.alertsGenerated += result.alertsGenerated;
    aggregate.emailsEnqueued += result.emailsEnqueued;
    metrics.recordFetched(label, result.fetched);
    metrics.recordInserted(result.inserted, label);
    metrics.recordSkipped(result.skipped, label);
    metrics.recordFailed(result.errors, label);
    metrics.recordAlerts(result.alertsGenerated);
    metrics.recordEmailsEnqueued(result.emailsEnqueued);
  };

  if (gh.status === "fulfilled") merge("Greenhouse", gh.value);
  else { console.error("[Greenhouse] Pipeline failed:", gh.reason); metrics.recordError("Greenhouse", String(gh.reason)); }

  if (ab.status === "fulfilled") merge("Ashby", ab.value);
  else { console.error("[Ashby] Pipeline failed:", ab.reason); metrics.recordError("Ashby", String(ab.reason)); }

  if (az.status === "fulfilled") merge("Adzuna", az.value);
  else { console.error("[Adzuna] Pipeline failed:", az.reason); metrics.recordError("Adzuna", String(az.reason)); }

  if (cs.status === "fulfilled") merge("CompanySites", cs.value);
  else { console.error("[CompanySites] Pipeline failed:", cs.reason); metrics.recordError("CompanySites", String(cs.reason)); }

  if (sr.status === "fulfilled") merge("SmartRecruiters", sr.value);
  else { console.error("[SmartRecruiters] Pipeline failed:", sr.reason); metrics.recordError("SmartRecruiters", String(sr.reason)); }

  await metrics.flush();
  return aggregate;
};

// ─── Direct execution ─────────────────────────────────────────────────────────
runAllPipelines()
  .then((result) => {
    console.log("[Ingestion] Completed:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("[Ingestion] Fatal error:", err);
    process.exit(1);
  });
