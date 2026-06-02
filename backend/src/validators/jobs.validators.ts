import { z } from "zod";

const toNumber = (value: unknown) => {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

const toBoolean = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

export const jobsQuerySchema = z.object({
  title: z.string().min(1).max(120).optional(),
  company: z.string().min(1).max(120).optional(),
  location: z.string().min(1).max(120).optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY", "FREELANCE"])
    .optional(),
  workType: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
  remote: z.preprocess(toBoolean, z.boolean().optional()),
  experience: z
    .enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])
    .optional(),
  salaryMin: z.preprocess(toNumber, z.number().int().min(0).optional()),
  salaryMax: z.preprocess(toNumber, z.number().int().min(0).optional()),
  q: z.string().min(1).max(200).optional(),
  sort: z.enum(["latest", "salary", "relevance"]).optional(),
  page: z.preprocess(toNumber, z.number().int().min(1).optional()),
  limit: z.preprocess(toNumber, z.number().int().min(1).max(200).optional()),
});
