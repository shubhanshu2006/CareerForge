import type { ApplicationStatus } from "../../generated/prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import {
  countApplications,
  createApplicationNote,
  findApplicationById,
  findJobById,
  listApplicationNotes,
  listApplications,
  updateApplicationStatus,
  upsertSavedApplication,
} from "../repositories/applications.repository.js";

const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  SAVED: ["SAVED", "APPLIED", "WITHDRAWN"],
  APPLIED: ["APPLIED", "OA", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  OA: ["OA", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  INTERVIEW: ["INTERVIEW", "FINAL_ROUND", "OFFER", "REJECTED", "WITHDRAWN"],
  FINAL_ROUND: ["FINAL_ROUND", "OFFER", "REJECTED", "WITHDRAWN"],
  OFFER: ["OFFER", "WITHDRAWN"],
  REJECTED: ["REJECTED"],
  WITHDRAWN: ["WITHDRAWN"],
};

export const saveJob = async (userId: number, jobId: number) => {
  const job = await findJobById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  return upsertSavedApplication(userId, jobId);
};

export const getApplications = async (input: {
  userId: number;
  page: number;
  limit: number;
}) => {
  const skip = (input.page - 1) * input.limit;
  const [total, items] = await Promise.all([
    countApplications(input.userId),
    listApplications(input.userId, skip, input.limit),
  ]);

  return {
    total,
    page: input.page,
    limit: input.limit,
    items,
  };
};

export const getApplication = async (userId: number, applicationId: number) => {
  const application = await findApplicationById(userId, applicationId);

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  return application;
};

export const updateStatus = async (input: {
  userId: number;
  applicationId: number;
  status: ApplicationStatus;
}) => {
  const application = await findApplicationById(
    input.userId,
    input.applicationId,
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  const allowed = allowedTransitions[application.status];
  if (!allowed.includes(input.status)) {
    throw new ApiError(409, "Invalid status transition");
  }

  return updateApplicationStatus(
    input.userId,
    input.applicationId,
    input.status,
  );
};

export const addNote = async (input: {
  userId: number;
  applicationId: number;
  round?: string;
  notes?: string;
  feedback?: string;
}) => {
  const application = await findApplicationById(
    input.userId,
    input.applicationId,
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  await createApplicationNote(input.applicationId, {
    round: input.round,
    notes: input.notes,
    feedback: input.feedback,
  });

  return listApplicationNotes(input.applicationId);
};

export const getNotes = async (input: {
  userId: number;
  applicationId: number;
}) => {
  const application = await findApplicationById(
    input.userId,
    input.applicationId,
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  return listApplicationNotes(input.applicationId);
};
