import { z } from "zod";

export const interviewAnalysisSchema = z.object({
  limit: z.number().int().min(1).max(200).optional(),
});

export const skillGapSchema = z.object({
  targetRole: z.string().min(2).max(120),
  targetSkills: z.array(z.string().max(60)).optional(),
});

export const roadmapSchema = z.object({
  targetRole: z.string().min(2).max(120),
  weeks: z.number().int().min(2).max(24).optional(),
});

export const patternSchema = z.object({
  limit: z.number().int().min(1).max(200).optional(),
});

export const interviewAnalysisResultSchema = z.object({
  summary: z.string().min(1),
  recurringWeaknesses: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)),
  highlightedExamples: z.array(
    z.object({
      company: z.string().min(1).optional(),
      round: z.string().min(1).optional(),
      notes: z.string().min(1).optional(),
      feedback: z.string().min(1).optional(),
    }),
  ),
});

export const skillGapResultSchema = z.object({
  missingSkills: z.array(z.string().min(1)),
  strengths: z.array(z.string().min(1)).optional(),
  recommendations: z.array(z.string().min(1)),
});

export const roadmapResultSchema = z.object({
  weeks: z.number().int().min(2).max(24),
  plan: z.array(
    z.object({
      week: z.number().int().min(1),
      focus: z.array(z.string().min(1)),
      outcomes: z.array(z.string().min(1)).optional(),
    }),
  ),
});

export const patternResultSchema = z.object({
  commonWeaknesses: z.array(z.string().min(1)),
  patterns: z.array(z.string().min(1)),
});
