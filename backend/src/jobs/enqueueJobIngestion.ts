import { jobIngestionQueue } from "../queues/index.js";
import type { RawJobInput } from "../services/jobIngestion.service.js";

export const enqueueJobIngestion = async (jobs: RawJobInput[]) =>
  jobIngestionQueue.add("ingest", { jobs });
