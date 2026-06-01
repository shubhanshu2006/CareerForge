/**
 * test-greenhouse.ts
 *
 * Standalone CLI runner to validate the Greenhouse ingestion pipeline.
 * Run with:
 *   npm run test-greenhouse
 *
 * Expected output:
 *   Fetched 250 jobs
 *   Inserted 210 jobs
 *   Skipped 40 duplicates
 *   Errors 0
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load backend .env for DATABASE_URL and other secrets
dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import { runGreenhousePipeline } from "./job-ingestion.service.js";

const main = async () => {
  console.log("=".repeat(50));
  console.log("  CareerForge — Greenhouse Pipeline Test");
  console.log("=".repeat(50));

  const start = Date.now();

  try {
    const result = await runGreenhousePipeline();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log("\n" + "─".repeat(50));
    console.log(`  ✅ Pipeline completed in ${elapsed}s`);
    console.log("─".repeat(50));
    console.log(`  Fetched   : ${result.fetched} jobs`);
    console.log(`  Inserted  : ${result.inserted} jobs`);
    console.log(`  Skipped   : ${result.skipped} duplicates`);
    console.log(`  Errors    : ${result.errors}`);
    console.log("─".repeat(50) + "\n");
  } catch (err) {
    console.error("\n❌ Pipeline failed:", err);
    process.exit(1);
  }
};

main();
