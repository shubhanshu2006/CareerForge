/**
 * test-workday.ts — Workday pipeline test runner.
 * Run with: npm run ingest-workday
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import { runWorkdayPipeline } from "./job-ingestion.service.js";

const main = async () => {
  console.log("=".repeat(50));
  console.log("  CareerForge — Workday Pipeline Test");
  console.log("=".repeat(50));

  const start = Date.now();
  try {
    const result = await runWorkdayPipeline();
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
