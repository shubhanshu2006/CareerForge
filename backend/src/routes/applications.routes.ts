import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createApplication,
  createApplicationNote,
  getUserApplication,
  listApplicationNotes,
  listUserApplications,
  updateApplicationStatus,
} from "../controllers/applications.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", createApplication);
router.get("/", listUserApplications);
router.get("/:id", getUserApplication);
router.patch("/:id/status", updateApplicationStatus);
router.post("/:id/notes", createApplicationNote);
router.get("/:id/notes", listApplicationNotes);

export default router;
