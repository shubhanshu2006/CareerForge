import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  getJob,
  getJobCountsHandler,
  listJobs,
  searchJobs,
} from "../controllers/jobs.controller.js";
import { authenticateClerkToken } from "../services/clerkAuth.service.js";

// Optional auth — attaches user if token present, never rejects unauthenticated requests
const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const clerkAuth = await authenticateClerkToken(header.slice(7));
      req.user = { id: clerkAuth.userId, role: String(clerkAuth.role) };
    } catch {
      // token invalid — continue as unauthenticated
    }
  }
  next();
};

const router = Router();

router.get("/counts", getJobCountsHandler);
router.get("/", optionalAuth, listJobs);
router.get("/search", optionalAuth, searchJobs);
router.get("/:id", optionalAuth, getJob);

export default router;
