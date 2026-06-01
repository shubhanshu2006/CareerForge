import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    yearsOfExperience: z.number().int().min(0).max(60).optional(),
    currentLocation: z.string().min(1).max(120).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.yearsOfExperience !== undefined ||
      data.currentLocation !== undefined,
    {
      message: "At least one field is required",
    },
  );

export const socialLinksSchema = z.object({
  links: z.array(
    z.object({
      platform: z.enum([
        "GITHUB",
        "LINKEDIN",
        "PORTFOLIO",
        "X",
        "MEDIUM",
        "DEVTO",
        "YOUTUBE",
        "OTHER",
      ]),
      url: z.string().url().max(300),
    }),
  ),
});

export const skillSchema = z.object({
  skill: z
    .string()
    .max(50)
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: "Skill is required",
    }),
});
