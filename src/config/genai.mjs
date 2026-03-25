import { GoogleGenAI } from '@google/genai';

let genai;

export const getGenAIClient = () => {
  if (genai) {
    return genai;
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is required to categorize inventory items.',
    );
  }

  genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return genai;
};
