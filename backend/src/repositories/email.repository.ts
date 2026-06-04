import { prisma } from "../config/prisma.js";

export const findUserForEmail = (userId: number) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });

export const findJobForEmail = (jobId: number) =>
  prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      applyUrl: true,
    },
  });

export const findJobsForEmail = (jobIds: number[]) =>
  prisma.job.findMany({
    where: { id: { in: jobIds } },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      applyUrl: true,
      isRemote: true,
      employmentType: true,
    },
  });

export const markJobAlertEmailed = (input: { userId: number; jobId: number }) =>
  prisma.jobAlert.updateMany({
    where: {
      userId: input.userId,
      jobId: input.jobId,
    },
    data: { emailSent: true },
  });
