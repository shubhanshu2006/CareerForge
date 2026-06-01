import { z } from "zod";

const toNumber = (value: unknown) => {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

export const createApplicationSchema = z.object({
  jobId: z.preprocess(toNumber, z.number().int().min(1)),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    "SAVED",
    "APPLIED",
    "OA",
    "INTERVIEW",
    "FINAL_ROUND",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
  ]),
});

export const createNoteSchema = z
  .object({
    round: z.string().min(1).max(80).optional(),
    notes: z.string().min(1).max(2000).optional(),
    feedback: z.string().min(1).max(2000).optional(),
  })
  .refine(
    (data) =>
      data.round !== undefined ||
      data.notes !== undefined ||
      data.feedback !== undefined,
    {
      message: "At least one field is required",
    },
  );

export const paginationSchema = z.object({
  page: z.preprocess(toNumber, z.number().int().min(1).optional()),
  limit: z.preprocess(toNumber, z.number().int().min(1).max(100).optional()),
});
