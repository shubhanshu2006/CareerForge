import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getUserPreferences,
  updateUserPreferences,
} from "../controllers/preferences.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getUserPreferences);
router.put("/", updateUserPreferences);

export default router;
