import type { Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { preferencesSchema } from "../validators/preferences.validators.js";
import {
  getPreferences,
  updatePreferences,
} from "../services/preferences.service.js";

const getUserId = (req: Request) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return req.user.id;
};

export const getUserPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getPreferences(getUserId(req));

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Preferences fetched"));
  },
);

export const updateUserPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid preferences data", parsed.error.issues);
    }

    const result = await updatePreferences({
      userId: getUserId(req),
      ...parsed.data,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Preferences updated"));
  },
);
