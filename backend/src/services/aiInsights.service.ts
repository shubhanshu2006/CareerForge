import { ApiError } from "../utils/ApiError.js";
import { z } from "zod";
import { geminiModel } from "../config/gemini.js";
import {
  fetchPreferenceSkills,
  fetchRejectedNotes,
  fetchUserSkills,
  saveInterviewAnalysis,
  savePatternInsight,
  saveRoadmap,
  saveSkillGapReport,
} from "../repositories/aiInsights.repository.js";
import {
  interviewAnalysisResultSchema,
  patternResultSchema,
  roadmapResultSchema,
  skillGapResultSchema,
} from "../validators/ai.validators.js";

const extractJson = (text: string) => {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new ApiError(502, "Gemini response missing JSON");
  }
  return text.slice(firstBrace, lastBrace + 1);
};

const parseGeminiJson = <T>(text: string, schema: z.ZodType<T>) => {
  const json = extractJson(text);
  const parsed = JSON.parse(json) as unknown;
  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new ApiError(502, "Gemini response failed validation");
  }
  return validated.data;
};

const buildNotesPayload = (notes: Array<any>) =>
  notes.map((note) => ({
    company: note.application?.job?.company ?? null,
    title: note.application?.job?.title ?? null,
    round: note.round ?? null,
    notes: note.notes ?? null,
    feedback: note.feedback ?? null,
  }));

export const analyzeInterviewFailures = async (input: {
  userId: number;
  limit: number;
}) => {
  const notes = await fetchRejectedNotes(input.userId, input.limit);

  if (notes.length === 0) {
    throw new ApiError(404, "No rejected interview notes found");
  }

  const payload = buildNotesPayload(notes);

  const prompt = `You are an interview coach. Analyze the following rejected interview notes and return JSON with keys: summary (string), recurringWeaknesses (string[]), recommendations (string[]), highlightedExamples (array of {company, round, notes, feedback}). Only output JSON. Notes: ${JSON.stringify(
    payload,
  )}`;

  const response = await geminiModel.generateContent(prompt);
  const result = parseGeminiJson(
    response.response.text(),
    interviewAnalysisResultSchema,
  );

  const saved = await saveInterviewAnalysis({
    userId: input.userId,
    summary: result.summary,
    analysis: result as unknown as Record<string, unknown>,
    noteCount: notes.length,
  });

  return { id: saved.id, ...result };
};

export const detectPatterns = async (input: {
  userId: number;
  limit: number;
}) => {
  const notes = await fetchRejectedNotes(input.userId, input.limit);

  if (notes.length === 0) {
    throw new ApiError(404, "No rejected interview notes found");
  }

  const payload = buildNotesPayload(notes);

  const prompt = `You are an interview analyst. Extract recurring weaknesses and patterns across interviews. Return JSON with keys: commonWeaknesses (string[]), patterns (string[]). Only output JSON. Notes: ${JSON.stringify(
    payload,
  )}`;

  const response = await geminiModel.generateContent(prompt);
  const result = parseGeminiJson(response.response.text(), patternResultSchema);

  const saved = await savePatternInsight({
    userId: input.userId,
    insight: result as unknown as Record<string, unknown>,
  });

  return { id: saved.id, ...result };
};

export const detectSkillGaps = async (input: {
  userId: number;
  targetRole: string;
  targetSkills?: string[];
}) => {
  const [profile, preferences] = await Promise.all([
    fetchUserSkills(input.userId),
    fetchPreferenceSkills(input.userId),
  ]);

  const userSkills = [
    ...(profile?.skills.map((item) => item.skill) ?? []),
    ...(preferences?.skills.map((item) => item.skill) ?? []),
  ];

  const prompt = `You are a career coach. Compare the user's skills with the target role. Return JSON with keys: missingSkills (string[]), strengths (string[], optional), recommendations (string[]). Only output JSON.
User skills: ${JSON.stringify(userSkills)}
Target role: ${input.targetRole}
Target skills: ${JSON.stringify(input.targetSkills ?? [])}`;

  const response = await geminiModel.generateContent(prompt);
  const result = parseGeminiJson(
    response.response.text(),
    skillGapResultSchema,
  );

  const saved = await saveSkillGapReport({
    userId: input.userId,
    targetRole: input.targetRole,
    report: result as unknown as Record<string, unknown>,
  });

  return { id: saved.id, ...result };
};

export const buildRoadmap = async (input: {
  userId: number;
  targetRole: string;
  weeks: number;
}) => {
  const prompt = `You are a career coach. Create a ${input.weeks}-week preparation roadmap for the target role. Return JSON with keys: weeks (number), plan (array of {week, focus, outcomes}). Only output JSON.
Target role: ${input.targetRole}`;

  const response = await geminiModel.generateContent(prompt);
  const result = parseGeminiJson(response.response.text(), roadmapResultSchema);

  const saved = await saveRoadmap({
    userId: input.userId,
    targetRole: input.targetRole,
    roadmap: result as unknown as Record<string, unknown>,
  });

  return { id: saved.id, ...result };
};

export const __testing = {
  extractJson,
};
