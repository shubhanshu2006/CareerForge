import { z } from "zod";

export const chatSearchSchema = z.object({
  query: z.string().min(3).max(500),
});

export const geminiSearchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  company: z.string().min(1).max(120).optional(),
  location: z.string().min(1).max(120).optional(),
  remote: z.boolean().optional(),
  salaryMin: z.number().int().min(0).optional(),
  experience: z
    .enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])
    .optional(),
});
