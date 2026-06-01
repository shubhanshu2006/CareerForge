import type { Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { chatSearchSchema } from "../validators/chat.validators.js";
import { searchJobsWithGemini } from "../services/chat.service.js";

export const chatSearch = asyncHandler(async (req: Request, res: Response) => {
  const parsed = chatSearchSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid chat search payload", parsed.error.issues);
  }

  const result = await searchJobsWithGemini({
    query: parsed.data.query,
    page: 1,
    limit: 20,
  });

  return res.status(200).json(new ApiResponse(200, result, "Search complete"));
});
