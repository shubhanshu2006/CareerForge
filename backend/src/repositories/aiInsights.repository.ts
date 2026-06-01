import { prisma } from "../config/prisma.js";

export const fetchRejectedNotes = async (userId: number, limit: number) =>
  prisma.applicationNote.findMany({
    where: {
      application: {
        userId,
        status: "REJECTED",
      },
    },
    include: {
      application: {
        include: {
          job: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });

export const fetchUserSkills = (userId: number) =>
  prisma.userProfile.findUnique({
    where: { id: userId },
    include: {
      skills: true,
    },
  });

export const fetchPreferenceSkills = (userId: number) =>
  prisma.userJobPreferences.findUnique({
    where: { userId },
    include: { skills: true },
  });

export const saveInterviewAnalysis = (input: {
  userId: number;
  summary: string;
  analysis: unknown;
  noteCount: number;
}) =>
  prisma.interviewFailureAnalysis.create({
    data: {
      userId: input.userId,
      summary: input.summary,
      analysis: input.analysis as any,
      noteCount: input.noteCount,
    },
  });

export const saveSkillGapReport = (input: {
  userId: number;
  targetRole: string;
  report: unknown;
}) =>
  prisma.skillGapReport.create({
    data: {
      userId: input.userId,
      targetRole: input.targetRole,
      report: input.report as any,
    },
  });

export const saveRoadmap = (input: {
  userId: number;
  targetRole: string;
  roadmap: unknown;
}) =>
  prisma.preparationRoadmap.create({
    data: {
      userId: input.userId,
      targetRole: input.targetRole,
      roadmap: input.roadmap as any,
    },
  });

export const savePatternInsight = (input: {
  userId: number;
  insight: unknown;
}) =>
  prisma.patternInsight.create({
    data: {
      userId: input.userId,
      insight: input.insight as any,
    },
  });
