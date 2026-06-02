import { Router } from "express";

import {
  getJob,
  getJobCountsHandler,
  listJobs,
  searchJobs,
} from "../controllers/jobs.controller.js";

const router = Router();

router.get("/counts", getJobCountsHandler);
router.get("/", listJobs);
router.get("/search", searchJobs);
router.get("/:id", getJob);

export default router;
