import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

let openaiClient = null;
let geminiClient = null;

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

export async function generateText(prompt, options = {}) {
  const openai = getOpenAIClient();

  if (openai) {
    try {
      console.log("Using OpenAI (gpt-4o-mini)");
      const messages = [{ role: "user", content: prompt }];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxOutputTokens ?? 8192,
        top_p: options.topP ?? 0.95,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.warn("OpenAI failed, falling back to Gemini:", error.message);
    }
  }

  const genAI = getGeminiClient();
  if (!genAI) {
    throw new Error("No AI provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY.");
  }

  console.log("Using Gemini (gemini-2.5-flash)");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      topK: options.topK ?? 40,
      topP: options.topP ?? 0.95,
      maxOutputTokens: options.maxOutputTokens ?? 8192,
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
