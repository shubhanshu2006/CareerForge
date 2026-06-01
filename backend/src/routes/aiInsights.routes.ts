import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import {
  interviewFailureAnalysis,
  patternInsights,
  preparationRoadmap,
  skillGapAnalysis,
} from "../controllers/aiInsights.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/interview-failures", interviewFailureAnalysis);
router.post("/patterns", patternInsights);
router.post("/skill-gaps", skillGapAnalysis);
router.post("/roadmap", preparationRoadmap);

export default router;
