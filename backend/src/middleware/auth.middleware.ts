import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { authenticateClerkToken } from "../services/clerkAuth.service.js";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(new ApiError(401, "Authorization required"));
    return;
  }

  const token = header.slice(7);

  try {
    const clerkAuth = await authenticateClerkToken(token);
    req.user = {
      id: clerkAuth.userId,
      role: String(clerkAuth.role),
    };

    next();
  } catch (error) {
    next(new ApiError(401, "Invalid access token"));
  }
};
