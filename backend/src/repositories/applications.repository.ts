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
    category?: string;
    overcome?: boolean;
  },
) =>
  prisma.applicationNote.create({
    data: {
      applicationId,
      round: data.round ?? null,
      notes: data.notes ?? null,
      feedback: data.feedback ?? null,
      category: data.category ?? null,
      overcome: data.overcome ?? false,
    },
  });

export const listApplicationNotes = (applicationId: number) =>
  prisma.applicationNote.findMany({
    where: { applicationId },
    orderBy: [{ createdAt: "desc" }],
  });

export const findNoteById = (noteId: number) =>
  prisma.applicationNote.findUnique({
    where: { id: noteId },
    include: {
      application: { include: { job: true } },
    },
  });

export const updateNoteOvercome = (noteId: number, overcome: boolean) =>
  prisma.applicationNote.update({
    where: { id: noteId },
    data: { overcome },
  });

export const listAllNotesForUser = (userId: number) =>
  prisma.applicationNote.findMany({
    where: { application: { userId } },
    include: {
      application: {
        include: { job: { select: { id: true, title: true, company: true } } },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

export const getWeaknessStats = async (userId: number) => {
  const [total, open, overcome] = await Promise.all([
    prisma.applicationNote.count({
      where: { application: { userId } },
    }),
    prisma.applicationNote.count({
      where: { application: { userId }, overcome: false },
    }),
    prisma.applicationNote.count({
      where: { application: { userId }, overcome: true },
    }),
  ]);
  return { total, open, overcome };
};
