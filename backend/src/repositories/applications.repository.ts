import { prisma } from "../config/prisma.js";
import type { ApplicationStatus } from "../../generated/prisma/index.js";

export const findApplicationById = (userId: number, applicationId: number) =>
  prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      job: true,
      notes: true,
    },
  });

export const listApplications = (userId: number, skip: number, take: number) =>
  prisma.application.findMany({
    where: { userId },
    include: { job: true },
    orderBy: [{ updatedAt: "desc" }],
    skip,
    take,
  });

export const countApplications = (userId: number) =>
  prisma.application.count({ where: { userId } });

export const upsertSavedApplication = (userId: number, jobId: number) =>
  prisma.application.upsert({
    where: {
      userId_jobId: { userId, jobId },
    },
    update: {
      status: "SAVED",
    },
    create: {
      userId,
      jobId,
      status: "SAVED",
    },
  });

export const updateApplicationStatus = (
  _userId: number,
  applicationId: number,
  status: ApplicationStatus,
) =>
  prisma.application.update({
    where: { id: applicationId },
    data: {
      status,
      appliedAt: status === "APPLIED" ? new Date() : undefined,
    },
  });

export const findJobById = (jobId: number) =>
  prisma.job.findUnique({ where: { id: jobId } });

export const createApplicationNote = (
  applicationId: number,
  data: {
    round?: string;
    notes?: string;
    feedback?: string;
  },
) =>
  prisma.applicationNote.create({
    data: {
      applicationId,
      round: data.round ?? null,
      notes: data.notes ?? null,
      feedback: data.feedback ?? null,
    },
  });

export const listApplicationNotes = (applicationId: number) =>
  prisma.applicationNote.findMany({
    where: { applicationId },
    orderBy: [{ createdAt: "desc" }],
  });
