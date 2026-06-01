import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../utils/ApiError.js";
import dotenv from "dotenv";

dotenv.config();

const getGeminiApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new ApiError(500, "GEMINI_API_KEY not configured");
  }
  return key;
};

const client = new GoogleGenerativeAI(getGeminiApiKey());

export const geminiModel = client.getGenerativeModel({
  model: "gemini-1.5-flash",
});
