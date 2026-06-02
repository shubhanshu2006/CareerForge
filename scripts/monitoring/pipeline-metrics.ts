/**
 * Pipeline Metrics & Monitoring.
 *
 * Tracks and persists metrics for every ingestion run:
 *
 *   - Jobs fetched per source
 *   - Jobs inserted (new)
 *   - Jobs failed (error during insert)
 *   - Jobs skipped (duplicates)
 *   - Emails sent
 *   - Alerts generated
 *   - Run duration
 *   - Per-company breakdowns
 *
 * Metrics are stored in two places:
 *   1. JSON log files (scripts/logs/ingestion-YYYY-MM-DD.jsonl)
 *   2. Prisma IngestionRun table (queryable via the backend API)
 *
 * Usage:
 *   const metrics = new PipelineMetrics("GREENHOUSE");
 *   metrics.recordFetched("stripe", 150);
 *   metrics.recordInserted(140);
 *   metrics.recordSkipped(10);
 *   await metrics.flush();
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../../backend/src/config/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.resolve(__dirname, "../logs");

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineSource =
  | "GREENHOUSE"
  | "LEVER"
  | "ASHBY"
  | "ADZUNA"
  | "SKILLCAREERHUB"
  | "WORKDAY"
  | "COMPANY_WEBSITE"
  | "ALL";

export interface CompanyMetric {
  company: string;
  fetched: number;
  inserted: number;
  skipped: number;
  failed: number;
  durationMs: number;
}

export interface RunMetrics {
  runId: string;
  source: PipelineSource;
  startedAt: Date;
  completedAt?: Date;
  durationMs: number;

  totalFetched: number;
  totalInserted: number;
  totalSkipped: number;
  totalFailed: number;
  alertsGenerated: number;
  emailsEnqueued: number;

  companies: CompanyMetric[];
  errors: Array<{ company: string; message: string }>;
}

// ─── Log File Management ──────────────────────────────────────────────────────

const ensureLogDir = (): void => {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
};

const getLogFilePath = (): string => {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_DIR, `ingestion-${date}.jsonl`);
};

const appendToLog = (entry: RunMetrics): void => {
  try {
    ensureLogDir();
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(getLogFilePath(), line, "utf-8");
  } catch (err) {
    console.error("[Metrics] Failed to write log file:", (err as Error).message);
  }
};

// ─── Prisma IngestionRun persistence ─────────────────────────────────────────

const persistRunToPrisma = async (metrics: RunMetrics): Promise<void> => {
  try {
    await prisma.ingestionRun.create({
      data: {
        runId: metrics.runId,
        source: metrics.source,
        startedAt: metrics.startedAt,
        completedAt: metrics.completedAt ?? new Date(),
        durationMs: metrics.durationMs,
        totalFetched: metrics.totalFetched,
        totalInserted: metrics.totalInserted,
        totalSkipped: metrics.totalSkipped,
        totalFailed: metrics.totalFailed,
        alertsGenerated: metrics.alertsGenerated,
        emailsEnqueued: metrics.emailsEnqueued,
        companiesJson: metrics.companies as never,
        errorsJson: metrics.errors as never,
      },
    });
  } catch (err) {
    // Metrics persistence should never crash the pipeline
    console.error(
      "[Metrics] Failed to persist run to DB:",
      (err as Error).message
    );
  }
};

// ─── PipelineMetrics Class ────────────────────────────────────────────────────

export class PipelineMetrics {
  private readonly runId: string;
  private readonly source: PipelineSource;
  private readonly startedAt: Date;

  private totalFetched = 0;
  private totalInserted = 0;
  private totalSkipped = 0;
  private totalFailed = 0;
  private alertsGenerated = 0;
  private emailsEnqueued = 0;

  private readonly companies: CompanyMetric[] = [];
  private readonly errors: Array<{ company: string; message: string }> = [];

  constructor(source: PipelineSource) {
    this.source = source;
    this.startedAt = new Date();
    this.runId = `${source.toLowerCase()}-${this.startedAt.getTime()}`;
  }

  /** Record raw jobs fetched from a company's API */
  recordFetched(company: string, count: number): void {
    this.totalFetched += count;
    this.getOrCreateCompanyMetric(company).fetched += count;
  }

  /** Record successfully inserted jobs */
  recordInserted(count: number, company?: string): void {
    this.totalInserted += count;
    if (company) this.getOrCreateCompanyMetric(company).inserted += count;
  }

  /** Record duplicate-skipped jobs */
  recordSkipped(count: number, company?: string): void {
    this.totalSkipped += count;
    if (company) this.getOrCreateCompanyMetric(company).skipped += count;
  }

  /** Record failed insert attempts */
  recordFailed(count: number, company?: string): void {
    this.totalFailed += count;
    if (company) this.getOrCreateCompanyMetric(company).failed += count;
  }

  /** Record job alerts created for matched users */
  recordAlerts(count: number): void {
    this.alertsGenerated += count;
  }

  /** Record emails enqueued to the email queue */
  recordEmailsEnqueued(count: number): void {
    this.emailsEnqueued += count;
  }

  /** Record a non-fatal error during scraping/normalization */
  recordError(company: string, message: string): void {
    this.errors.push({ company, message });
  }

  /** Record duration for a specific company */
  recordCompanyDuration(company: string, durationMs: number): void {
    this.getOrCreateCompanyMetric(company).durationMs = durationMs;
  }

  /** Finalize metrics, persist to file + DB, and print summary */
  async flush(): Promise<RunMetrics> {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - this.startedAt.getTime();

    const metrics: RunMetrics = {
      runId: this.runId,
      source: this.source,
      startedAt: this.startedAt,
      completedAt,
      durationMs,
      totalFetched: this.totalFetched,
      totalInserted: this.totalInserted,
      totalSkipped: this.totalSkipped,
      totalFailed: this.totalFailed,
      alertsGenerated: this.alertsGenerated,
      emailsEnqueued: this.emailsEnqueued,
      companies: this.companies,
      errors: this.errors,
    };

    // Print summary to console
    this.printSummary(metrics);

    // Persist to file (synchronous, always succeeds)
    appendToLog(metrics);

    // Persist to DB (async, best-effort)
    await persistRunToPrisma(metrics);

    return metrics;
  }

  private getOrCreateCompanyMetric(company: string): CompanyMetric {
    let metric = this.companies.find((c) => c.company === company);
    if (!metric) {
      metric = {
        company,
        fetched: 0,
        inserted: 0,
        skipped: 0,
        failed: 0,
        durationMs: 0,
      };
      this.companies.push(metric);
    }
    return metric;
  }

  private printSummary(m: RunMetrics): void {
    const elapsed = (m.durationMs / 1000).toFixed(1);
    console.log(`\n${"═".repeat(60)}`);
    console.log(`  📊 ${m.source} Pipeline Metrics`);
    console.log(`${"─".repeat(60)}`);
    console.log(`  Run ID    : ${m.runId}`);
    console.log(`  Duration  : ${elapsed}s`);
    console.log(`${"─".repeat(60)}`);
    console.log(`  Fetched   : ${m.totalFetched}`);
    console.log(`  Inserted  : ${m.totalInserted}`);
    console.log(`  Skipped   : ${m.totalSkipped}  (duplicates)`);
    console.log(`  Failed    : ${m.totalFailed}`);
    console.log(`  Alerts    : ${m.alertsGenerated}`);
    console.log(`  Emails    : ${m.emailsEnqueued}`);
    if (m.errors.length > 0) {
      console.log(`  Errors    : ${m.errors.length}`);
      m.errors.slice(0, 5).forEach((e) => {
        console.log(`    ⚠ ${e.company}: ${e.message}`);
      });
    }
    console.log(`${"═".repeat(60)}\n`);
  }
}

// ─── Log Reader ───────────────────────────────────────────────────────────────

/**
 * Read and parse all ingestion log entries from a given date range.
 * Useful for building dashboards and reporting.
 */
export const readIngestionLogs = (options?: {
  fromDate?: Date;
  toDate?: Date;
  source?: PipelineSource;
}): RunMetrics[] => {
  const logs: RunMetrics[] = [];

  if (!fs.existsSync(LOG_DIR)) return logs;

  const files = fs
    .readdirSync(LOG_DIR)
    .filter((f) => f.startsWith("ingestion-") && f.endsWith(".jsonl"))
    .sort();

  for (const file of files) {
    const fileDate = new Date(file.replace("ingestion-", "").replace(".jsonl", ""));

    if (options?.fromDate && fileDate < options.fromDate) continue;
    if (options?.toDate && fileDate > options.toDate) continue;

    const content = fs.readFileSync(path.join(LOG_DIR, file), "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as RunMetrics;
        if (options?.source && entry.source !== options.source) continue;
        logs.push(entry);
      } catch {
        // Skip malformed log lines
      }
    }
  }

  return logs;
};

/**
 * Get aggregate stats across all stored log entries.
 */
export const getAggregateStats = (logs: RunMetrics[]) => ({
  totalRuns: logs.length,
  totalFetched: logs.reduce((s, l) => s + l.totalFetched, 0),
  totalInserted: logs.reduce((s, l) => s + l.totalInserted, 0),
  totalSkipped: logs.reduce((s, l) => s + l.totalSkipped, 0),
  totalFailed: logs.reduce((s, l) => s + l.totalFailed, 0),
  totalAlerts: logs.reduce((s, l) => s + l.alertsGenerated, 0),
  totalEmails: logs.reduce((s, l) => s + l.emailsEnqueued, 0),
  avgDurationMs:
    logs.length > 0
      ? logs.reduce((s, l) => s + l.durationMs, 0) / logs.length
      : 0,
});
