import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { LANGUAGE_NAMES } from "../../../lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request) {
  try {
    const { transcript, language } = await request.json();

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: "Invalid transcript format" },
        { status: 400 }
      );
    }

    const languageName = LANGUAGE_NAMES[language] || "Hindi";

    // Combine all transcript segments into full text
    const fullText = transcript.map((seg) => seg.text).join(" ");

    const prompt = `You are an expert educational content creator. Based on the following video transcript in ${languageName}, generate 5 multiple-choice quiz questions to test understanding.

TRANSCRIPT:
${fullText}

REQUIREMENTS:
1. Generate EXACTLY 5 questions in ${languageName}
2. Each question should have 4 options (A, B, C, D)
3. Questions should test key concepts from the video
4. Include a mix of difficulty levels (2 easy, 2 medium, 1 hard)
5. Mark the correct answer for each question
6. Questions should be clear and unambiguous

OUTPUT FORMAT: Return ONLY a valid JSON array. No markdown, no code blocks, no explanations.
[
  {
    "question": "Question text in ${languageName}",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "difficulty": "easy",
    "explanation": "Brief explanation in ${languageName} why this is correct"
  },
  ...
]

CRITICAL: Start your response with [ and end with ]. No other text.`;

    console.log("🧠 Generating quiz questions in", languageName);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    let quizQuestions;
    try {
      const jsonText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      quizQuestions = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      console.error("Response text:", responseText.substring(0, 500));
      throw new Error("Failed to parse quiz response. Please try again.");
    }

    if (!Array.isArray(quizQuestions) || quizQuestions.length !== 5) {
      throw new Error("Invalid quiz format - expected 5 questions");
    }

    console.log("✅ Generated", quizQuestions.length, "quiz questions");

    return NextResponse.json({
      questions: quizQuestions,
      language: languageName,
    });
  } catch (error) {
    console.error("💥 Quiz generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
