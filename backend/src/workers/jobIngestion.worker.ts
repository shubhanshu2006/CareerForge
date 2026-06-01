import { Worker, type Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import {
  ingestJobs,
  type RawJobInput,
} from "../services/jobIngestion.service.js";

const runAllPipelinesLazy = async () => {
  const { runAllPipelines } = await import(
    "../../../scripts/ingestion/job-ingestion.service.js" as string
  );
  return runAllPipelines();
};

const handleIngestionJob = async (job: Job) => {
  const data = job.data as { type?: string; jobs?: RawJobInput[] };

  if (data?.type === "all") {
    console.log(`[Worker] Running full ingestion pipeline (job #${job.id})`);
    const result = await runAllPipelinesLazy();
    console.log(
      `[Worker] Ingestion complete — fetched: ${result.fetched}, inserted: ${result.inserted}, skipped: ${result.skipped}, errors: ${result.errors}`,
    );
    return result;
  }

  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  if (jobs.length === 0) {
    console.warn(`[Worker] No jobs in payload for job #${job.id}`);
    return { received: 0, created: 0, skipped: 0, errors: [] };
  }

  console.log(`[Worker] Ingesting ${jobs.length} raw jobs (job #${job.id})`);
  const result = await ingestJobs(jobs);
  console.log(
    `[Worker] Done — created: ${result.created}, skipped: ${result.skipped}, errors: ${result.errors.length}`,
  );
  return result;
};

export const jobIngestionWorker = new Worker(
  "jobIngestionQueue",
  handleIngestionJob,
  {
    connection: redisConnection,
    concurrency: 1, // Ingestion jobs are CPU/DB-heavy; one at a time
  },
);

jobIngestionWorker.on("failed", (job, err) => {
  console.error(
    `[Worker] jobIngestionQueue job #${job?.id} failed:`,
    err.message,
  );
});

jobIngestionWorker.on("error", (err) => {
  console.error("[Worker] jobIngestionQueue worker error:", err.message);
});
