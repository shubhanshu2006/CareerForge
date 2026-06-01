import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import {
  sendJobAlertEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
} from "../services/email.service.js";

export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    switch (job.name) {
      case "welcomeEmail":
        return sendWelcomeEmail(job.data.userId);

      case "jobAlert":
        return sendJobAlertEmail({
          userId: job.data.userId,
          jobId: job.data.jobId,
        });

      case "verifyEmail":
        return sendVerificationEmail({
          userId: job.data.userId,
          token: job.data.token,
        });

      default:
        console.warn(`[EmailWorker] Unknown job type: ${job.name}`);
        return null;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Email jobs are I/O-bound; run several in parallel
  },
);

emailWorker.on("completed", (job) => {
  console.log(`[EmailWorker] ${job.name} job #${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(
    `[EmailWorker] ${job?.name ?? "unknown"} job #${job?.id} failed:`,
    err.message,
  );
});

emailWorker.on("error", (err) => {
  console.error("[EmailWorker] Worker error:", err.message);
});
