import { Router } from "express";
import {
  getHealth,
  getRuns,
  getRunById,
  getAggregates,
} from "../controllers/monitoring.controller.js";

const router = Router();

// GET /api/v1/monitoring/health
router.get("/health", getHealth);

// GET /api/v1/monitoring/runs
router.get("/runs", getRuns);

// GET /api/v1/monitoring/runs/:runId
router.get("/runs/:runId", getRunById);

// GET /api/v1/monitoring/aggregates
router.get("/aggregates", getAggregates);

export default router;
