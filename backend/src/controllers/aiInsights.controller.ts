import type { Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  interviewAnalysisSchema,
  patternSchema,
  roadmapSchema,
  skillGapSchema,
} from "../validators/ai.validators.js";
import {
  analyzeInterviewFailures,
  buildRoadmap,
  detectPatterns,
  detectSkillGaps,
} from "../services/aiInsights.service.js";

const getUserId = (req: Request) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return req.user.id;
};

export const interviewFailureAnalysis = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = interviewAnalysisSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new ApiError(400, "Invalid analysis request", parsed.error.issues);
    }

    const result = await analyzeInterviewFailures({
      userId: getUserId(req),
      limit: parsed.data.limit ?? 50,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Analysis complete"));
  },
);

export const patternInsights = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = patternSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new ApiError(400, "Invalid pattern request", parsed.error.issues);
    }

    const result = await detectPatterns({
      userId: getUserId(req),
      limit: parsed.data.limit ?? 80,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Patterns fetched"));
  },
);

export const skillGapAnalysis = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = skillGapSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid skill gap request", parsed.error.issues);
    }

    const result = await detectSkillGaps({
      userId: getUserId(req),
      targetRole: parsed.data.targetRole,
      targetSkills: parsed.data.targetSkills,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Skill gaps analyzed"));
  },
);

export const preparationRoadmap = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = roadmapSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid roadmap request", parsed.error.issues);
    }

    const result = await buildRoadmap({
      userId: getUserId(req),
      targetRole: parsed.data.targetRole,
      weeks: parsed.data.weeks ?? 8,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Roadmap generated"));
  },
);
