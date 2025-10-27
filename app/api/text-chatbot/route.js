import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { LANGUAGE_NAMES } from "../../../lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request) {
  try {
    const { question, language, videoContext, conversationHistory } =
      await request.json();

    console.log(`💬 Chatbot Question in ${language}:`, question);

    const languageName = LANGUAGE_NAMES[language] || "Hindi";

    let conversationContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = "\n\nPREVIOUS CONVERSATION:\n";
      conversationHistory.forEach((msg) => {
        if (msg.role === "user") {
          conversationContext += `Student: ${msg.content}\n`;
        } else if (msg.role === "bot") {
          conversationContext += `Assistant: ${msg.content}\n`;
        }
      });
    }

    const videoSummary = videoContext.transcript
      .slice(0, 30)
      .map((seg) => seg.text)
      .join(" ")
      .substring(0, 1500);

    const prompt = `You are a helpful AI assistant helping students understand educational content in ${languageName}. A student watched a video and has a question.

VIDEO SUMMARY:
${videoSummary}

CULTURAL ADAPTATIONS MADE:
- Currency conversions: ${videoContext.changes.currencyConversions}
- Location changes: ${videoContext.changes.locationChanges}
- Measurement conversions: ${videoContext.changes.measurementConversions}
${conversationContext}

STUDENT'S QUESTION (in ${languageName}):
"${question}"

RESPONSE GUIDELINES:
1. **Answer in ${languageName}** using natural, conversational language
2. **Be concise but complete** - aim for 4-8 sentences
3. **Use Indian examples and context**:
   - Daily life: chai, cricket, trains, markets
   - Education: schools, exams, notebooks
   - Culture: festivals, food, family
4. **Structure your answer clearly**:
   - Start with direct answer
   - Give explanation with examples
   - Connect to the video content
5. **Use simple formatting**:
   - Break into paragraphs if needed
   - Use bullet points for lists (•)
   - Bold key terms sparingly
6. **Be encouraging** - Students are learning!

IMPORTANT: Respond ONLY in ${languageName}. Make it easy to copy and save as notes.`;

    console.log("🤖 Calling Gemini for chatbot response...");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
    });

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    console.log(`✅ Generated answer in ${languageName}`);

    const relatedQuestions = await generateRelatedQuestions(
      question,
      language,
      videoSummary
    );

    return NextResponse.json({
      answer,
      relatedQuestions,
      language: languageName,
    });
  } catch (error) {
    console.error("💥 Chatbot error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process question" },
      { status: 500 }
    );
  }
}

async function generateRelatedQuestions(
  originalQuestion,
  language,
  videoSummary
) {
  try {
    const languageName = LANGUAGE_NAMES[language] || "Hindi";

    const prompt = `Based on this student question in ${languageName}:
"${originalQuestion}"

And this video content:
${videoSummary.substring(0, 500)}

Generate 3 SHORT related follow-up questions that students commonly ask. Each question should be:
- In ${languageName}
- Maximum 10-12 words
- Practical and helpful
- Related to understanding the concept better

Return ONLY a JSON array of 3 questions, no other text:
["question1", "question2", "question3"]`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 300,
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      return questions.slice(0, 3);
    }

    return [];
  } catch (error) {
    console.error("⚠️ Failed to generate related questions:", error);
    return [];
  }
}
