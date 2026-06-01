import { z } from "zod";

const stringArray = z
  .array(z.string().max(100))
  .transform((items) =>
    Array.from(
      new Set(
        items.map((item) => item.trim()).filter((item) => item.length > 0),
      ),
    ),
  );

export const preferencesSchema = z
  .object({
    roles: stringArray.optional(),
    titles: stringArray.optional(),
    skills: stringArray.optional(),
    companies: stringArray.optional(),
    emailEnabled: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.roles !== undefined ||
      data.titles !== undefined ||
      data.skills !== undefined ||
      data.companies !== undefined ||
      data.emailEnabled !== undefined,
    {
      message: "At least one preference field is required",
    },
  );
