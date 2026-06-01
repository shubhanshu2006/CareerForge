import { geminiModel } from "../config/gemini.js";
import { ApiError } from "../utils/ApiError.js";
import { geminiSearchSchema } from "../validators/chat.validators.js";
import { getJobs } from "./jobs.service.js";

const buildPrompt = (query: string) => `
You are a job search parser. Extract a JSON object with the following keys:
- title (string, optional)
- company (string, optional)
- location (string, optional)
- remote (boolean, optional)
- salaryMin (number, optional)
- experience (one of ENTRY,JUNIOR,MID,SENIOR,LEAD,EXECUTIVE, optional)
Only output valid JSON without markdown.
Query: "${query}"
`;

export const searchJobsWithGemini = async (input: {
  query: string;
  page: number;
  limit: number;
}) => {
  const prompt = buildPrompt(input.query);
  const response = await geminiModel.generateContent(prompt);
  const text = response.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ApiError(502, "Gemini response was not valid JSON");
  }

  const validated = geminiSearchSchema.safeParse(parsed);
  if (!validated.success) {
    throw new ApiError(502, "Gemini response failed validation");
  }

  return getJobs({
    filters: {
      title: validated.data.title,
      company: validated.data.company,
      location: validated.data.location,
      remote: validated.data.remote,
      salaryMin: validated.data.salaryMin,
      experience: validated.data.experience,
    },
    sort: "relevance",
    page: input.page,
    limit: input.limit,
  });
};
