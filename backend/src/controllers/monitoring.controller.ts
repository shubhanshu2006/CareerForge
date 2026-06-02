import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getPipelineHealth,
  getIngestionHistory,
  getRunDetails,
  getAggregateMetrics,
} from "../services/monitoring.service.js";

const readQueryString = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;
const readParamString = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getPipelineHealth();
  res.json(new ApiResponse(200, data, "Pipeline health retrieved"));
});

export const getRuns = asyncHandler(async (req: Request, res: Response) => {
  const source = readQueryString(req.query.source as string | string[] | undefined);
  const days = readQueryString(req.query.days as string | string[] | undefined);
  const limit = readQueryString(req.query.limit as string | string[] | undefined);

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
  const runId = readParamString(req.params.runId as string | string[] | undefined);
  if (!runId) {
    res.status(400).json(new ApiResponse(400, null, "Run id is required"));
    return;
  }
  const run = await getRunDetails(runId);

  if (!run) {
    res.status(404).json(new ApiResponse(404, null, "Run not found"));
    return;
  }

  res.json(new ApiResponse(200, run, "Run details retrieved"));
});

export const getAggregates = asyncHandler(
  async (req: Request, res: Response) => {
    const source = readQueryString(req.query.source as string | string[] | undefined);
    const fromDate = readQueryString(req.query.fromDate as string | string[] | undefined);
    const toDate = readQueryString(req.query.toDate as string | string[] | undefined);

    const data = await getAggregateMetrics({
      source,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });

    res.json(new ApiResponse(200, data, "Aggregates retrieved"));
  },
);
