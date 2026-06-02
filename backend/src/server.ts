import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startScheduler } from "./jobs/scheduler.js";

// ─── BullMQ Workers ───────────────────────────────────────────────────────────
// Import workers so they register with BullMQ on startup.
import "./workers/jobIngestion.worker.js";
import "./workers/email.worker.js";

const PORT = process.env.PORT || 5000;

const shutdown = async () => {
  console.log("[Server] Graceful shutdown initiated...");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

connectDB()
  .then(async () => {
    // Start the hourly repeatable ingestion scheduler
    await startScheduler();

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(
        `[Server] Environment: ${process.env.NODE_ENV ?? "development"}`,
      );
    });
  })
  .catch((err) => {
    console.error("[Server] Failed to connect to database:", err);
    process.exit(1);
  });
