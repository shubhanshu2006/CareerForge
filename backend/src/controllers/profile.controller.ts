import type { Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  skillSchema,
  socialLinksSchema,
  updateProfileSchema,
} from "../validators/profile.validators.js";
import {
  addSkill,
  getProfile,
  removeSkill,
  updateProfile,
  updateSocialLinks,
} from "../services/profile.service.js";

const getUserId = (req: Request) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return req.user.id;
};

export const getUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getProfile(getUserId(req));

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Profile fetched"));
  },
);

export const updateUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid profile data", parsed.error.issues);
    }

    const result = await updateProfile(getUserId(req), parsed.data);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Profile updated"));
  },
);

export const updateUserSocialLinks = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = socialLinksSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid social links", parsed.error.issues);
    }

    const result = await updateSocialLinks(getUserId(req), parsed.data.links);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Social links updated"));
  },
);

export const addUserSkill = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = skillSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid skill", parsed.error.issues);
    }

    const result = await addSkill(getUserId(req), parsed.data.skill);

    return res.status(200).json(new ApiResponse(200, result, "Skill added"));
  },
);

export const removeUserSkill = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = skillSchema.safeParse({
      skill: req.params.skill,
    });
    if (!parsed.success) {
      throw new ApiError(400, "Invalid skill", parsed.error.issues);
    }

    const result = await removeSkill(getUserId(req), parsed.data.skill);

    return res.status(200).json(new ApiResponse(200, result, "Skill removed"));
  },
);
