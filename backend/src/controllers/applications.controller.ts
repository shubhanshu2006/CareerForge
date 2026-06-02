import type { Request, Response } from "express";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createApplicationSchema,
  createNoteSchema,
  paginationSchema,
  updateNoteOvercomeSchema,
  updateStatusSchema,
} from "../validators/applications.validators.js";
import {
  addNote,
  getAllUserNotes,
  getApplication,
  getApplications,
  getNotes,
  saveJob,
  toggleNoteOvercome,
  updateStatus,
} from "../services/applications.service.js";

const getUserId = (req: Request) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return req.user.id;
};

export const createApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = createApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid application payload",
        parsed.error.issues,
      );
    }

    const result = await saveJob(getUserId(req), parsed.data.jobId);

    return res.status(201).json(new ApiResponse(201, result, "Job saved"));
  },
);

export const listUserApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid pagination", parsed.error.issues);
    }

    const result = await getApplications({
      userId: getUserId(req),
      page: parsed.data.page || 1,
      limit: parsed.data.limit || 20,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Applications fetched"));
  },
);

export const getUserApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    if (!Number.isInteger(applicationId)) {
      throw new ApiError(400, "Invalid application id");
    }

    const result = await getApplication(getUserId(req), applicationId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Application fetched"));
  },
);

export const updateApplicationStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    if (!Number.isInteger(applicationId)) {
      throw new ApiError(400, "Invalid application id");
    }

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid status payload", parsed.error.issues);
    }

    const result = await updateStatus({
      userId: getUserId(req),
      applicationId,
      status: parsed.data.status,
    });

    return res.status(200).json(new ApiResponse(200, result, "Status updated"));
  },
);

export const createApplicationNote = asyncHandler(
  async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    if (!Number.isInteger(applicationId)) {
      throw new ApiError(400, "Invalid application id");
    }

    const parsed = createNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid note payload", parsed.error.issues);
    }

    const result = await addNote({
      userId: getUserId(req),
      applicationId,
      ...parsed.data,
    });

    return res.status(201).json(new ApiResponse(201, result, "Note added"));
  },
);

export const listApplicationNotes = asyncHandler(
  async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    if (!Number.isInteger(applicationId)) {
      throw new ApiError(400, "Invalid application id");
    }

    const result = await getNotes({
      userId: getUserId(req),
      applicationId,
    });

    return res.status(200).json(new ApiResponse(200, result, "Notes fetched"));
  },
);

export const updateNoteOvercomeController = asyncHandler(
  async (req: Request, res: Response) => {
    const noteId = Number(req.params.noteId);
    if (!Number.isInteger(noteId)) {
      throw new ApiError(400, "Invalid note id");
    }

    const parsed = updateNoteOvercomeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid payload", parsed.error.issues);
    }

    const result = await toggleNoteOvercome({
      userId: getUserId(req),
      noteId,
      overcome: parsed.data.overcome,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Note updated"));
  },
);

export const listAllUserNotesController = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getAllUserNotes(getUserId(_req));
    return res
      .status(200)
      .json(new ApiResponse(200, result, "All notes fetched"));
  },
);
