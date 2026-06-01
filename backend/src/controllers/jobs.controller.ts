import type { Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { jobsQuerySchema } from "../validators/jobs.validators.js";
import { getJobById, getJobs } from "../services/jobs.service.js";

const buildFilters = (data: {
  title?: string;
  company?: string;
  location?: string;
  remote?: boolean;
  experience?: "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
  salaryMin?: number;
  salaryMax?: number;
  q?: string;
}) => ({
  title: data.title,
  company: data.company,
  location: data.location,
  remote: data.remote,
  experience: data.experience,
  salaryMin: data.salaryMin,
  salaryMax: data.salaryMax,
  query: data.q,
});

const parseQuery = (req: Request) => {
  const parsed = jobsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid job query", parsed.error.issues);
  }

  return parsed.data;
};

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const data = parseQuery(req);

  const result = await getJobs({
    filters: buildFilters(data),
    sort: data.sort || "latest",
    page: data.page || 1,
    limit: data.limit || 20,
  });

  return res.status(200).json(new ApiResponse(200, result, "Jobs fetched"));
});

export const searchJobs = asyncHandler(async (req: Request, res: Response) => {
  const data = parseQuery(req);

  const result = await getJobs({
    filters: buildFilters(data),
    sort: data.sort || (data.q ? "relevance" : "latest"),
    page: data.page || 1,
    limit: data.limit || 20,
  });

  return res.status(200).json(new ApiResponse(200, result, "Jobs fetched"));
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Invalid job id");
  }

  const result = await getJobById(id);

  return res.status(200).json(new ApiResponse(200, result, "Job fetched"));
});
