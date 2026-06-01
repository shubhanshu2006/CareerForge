import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getPipelineHealth,
  getIngestionHistory,
  getRunDetails,
  getAggregateMetrics,
} from "../services/monitoring.service.js";

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getPipelineHealth();
  res.json(new ApiResponse(200, data, "Pipeline health retrieved"));
});

export const getRuns = asyncHandler(async (req: Request, res: Response) => {
  const { source, days, limit } = req.query as Record<string, string>;

  const runs = await getIngestionHistory({
    source,
    days: days ? parseInt(days, 10) : 7,
    limit: limit ? parseInt(limit, 10) : 50,
  });

  res.json(
    new ApiResponse(200, { runs, total: runs.length }, "Runs retrieved"),
  );
});

export const getRunById = asyncHandler(async (req: Request, res: Response) => {
  const { runId } = req.params;
  const run = await getRunDetails(runId);

  if (!run) {
    res.status(404).json(new ApiResponse(404, null, "Run not found"));
    return;
  }

  res.json(new ApiResponse(200, run, "Run details retrieved"));
});

export const getAggregates = asyncHandler(
  async (req: Request, res: Response) => {
    const { source, fromDate, toDate } = req.query as Record<string, string>;

    const data = await getAggregateMetrics({
      source,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });

    res.json(new ApiResponse(200, data, "Aggregates retrieved"));
  },
);
