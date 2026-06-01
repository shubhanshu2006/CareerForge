import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import {
  addUserSkill,
  getUserProfile,
  removeUserSkill,
  updateUserProfile,
  updateUserSocialLinks,
} from "../controllers/profile.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getUserProfile);
router.put("/", updateUserProfile);
router.put("/social-links", updateUserSocialLinks);
router.post("/skills", addUserSkill);
router.delete("/skills/:skill", removeUserSkill);

export default router;
