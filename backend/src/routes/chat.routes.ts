import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { chatSearch } from "../controllers/chat.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/search", chatSearch);

export default router;
