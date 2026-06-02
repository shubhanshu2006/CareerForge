import { jobIngestionQueue } from "../queues/index.js";

const REPEAT_EVERY_MS = 60 * 60 * 1000; // 1 hour

const SCHEDULER_JOB_NAME = "scheduled-ingestion";

export const startScheduler = async (): Promise<void> => {
  try {
    // Remove any stale repeatable jobs from previous deployments
    const existing = await jobIngestionQueue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === SCHEDULER_JOB_NAME) {
        await jobIngestionQueue.removeRepeatableByKey(job.key);
      }
    }

    // Register the new repeatable job
    await jobIngestionQueue.add(
      SCHEDULER_JOB_NAME,
      { type: "all" }, // payload tells the worker to run all pipelines
      {
        repeat: {
          every: REPEAT_EVERY_MS,
          immediately: true, // also run once right after server starts
        },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      },
    );

    console.log(
      `[Scheduler] Job ingestion scheduled — runs every ${REPEAT_EVERY_MS / 3_600_000} hour(s)`,
    );
  } catch (err) {
    console.error("[Scheduler] Failed to start scheduler:", err);
    throw err;
  }
};

/**
 * Remove all repeatable ingestion jobs — call during graceful server shutdown.
 */
export const stopScheduler = async (): Promise<void> => {
  try {
    const jobs = await jobIngestionQueue.getRepeatableJobs();
    await Promise.all(
      jobs
        .filter((j) => j.name === SCHEDULER_JOB_NAME)
        .map((j) => jobIngestionQueue.removeRepeatableByKey(j.key)),
    );
    console.log("[Scheduler] Ingestion scheduler stopped.");
  } catch (err) {
    console.warn("[Scheduler] Error stopping scheduler:", err);
  }
};
