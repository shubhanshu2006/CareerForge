import type { Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboardMetrics } from "../services/dashboard.service.js";

const getUserId = (req: Request) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return req.user.id;
};

export const getDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getDashboardMetrics(getUserId(req));

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Dashboard fetched"));
  },
);
