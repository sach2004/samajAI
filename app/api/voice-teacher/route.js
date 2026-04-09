import { NextResponse } from "next/server";
import { LANGUAGE_NAMES } from "../../../lib/constants";
import { generateText } from "../../../lib/ai";

const LANGUAGE_CODES = {
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
};

const VOICE_MAP = {
  hi: "hi-IN-Wavenet-D",
  ta: "ta-IN-Wavenet-A",
  te: "te-IN-Standard-A",
  bn: "bn-IN-Wavenet-A",
  kn: "kn-IN-Wavenet-A",
  ml: "ml-IN-Wavenet-A",
  gu: "gu-IN-Wavenet-A",
  mr: "mr-IN-Wavenet-A",
};

export async function POST(request) {
  try {
    const { question, language, videoContext, conversationHistory } =
      await request.json();

    console.log(`🎤 Voice Teacher Question in ${language}:`, question);

    const languageName = LANGUAGE_NAMES[language] || "Hindi";

    let conversationContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = "\n\nPREVIOUS CONVERSATION:\n";
      conversationHistory.forEach((msg) => {
        if (msg.role === "student") {
          conversationContext += `Student: ${msg.content}\n`;
        } else if (msg.role === "teacher") {
          conversationContext += `Teacher: ${msg.content}\n`;
        }
      });
    }

    const videoSummary = (videoContext?.transcript || [])
      .slice(0, 20)
      .map((seg) => seg.text)
      .join(" ")
      .substring(0, 1000);

    const prompt = `You are a warm, encouraging Indian teacher (Guru ji/Madam) teaching students in ${languageName}. A student just watched an educational video and has a doubt.

VIDEO SUMMARY:
${videoSummary}
${conversationContext}

STUDENT QUESTION (in ${languageName}):
"${question}"

TEACHING GUIDELINES:
1. Speak in natural, conversational ${languageName} - like a friendly neighborhood teacher
2. Be warm and encouraging - Use encouraging phrases
3. Use culturally relevant Indian examples: Everyday life like chai, cricket, trains, festivals, family. Local context like sabzi mandi, school, mohalla, village. Regional foods like dosa, samosa, biryani, mithai
4. Keep answers concise (3-5 sentences) - this will be spoken aloud
5. Check understanding - End with a gentle question or encouragement
6. Use simple language - Avoid heavy technical jargon
7. Be patient and supportive - Students learn at different paces

IMPORTANT: Respond ONLY in ${languageName}. Keep it short for voice output (max 150 words).`;

    console.log("🤖 Generating teacher response...");

    const answer = (await generateText(prompt, { temperature: 0.8, topP: 0.95, maxOutputTokens: 500 })).trim();

    console.log(
      `✅ Generated answer in ${languageName}:`,
      answer.substring(0, 100)
    );

    console.log("🎙️ Generating speech audio...");

    const audioBase64 = await generateSpeech(answer, language);

    return NextResponse.json({
      answer,
      audioBase64,
      language: languageName,
    });
  } catch (error) {
    console.error("💥 Voice Teacher error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process question" },
      { status: 500 }
    );
  }
}

async function generateSpeech(text, language) {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ TTS API key not configured, skipping audio");
    return null;
  }

  const voiceName = VOICE_MAP[language] || "hi-IN-Wavenet-D";
  const languageCode = LANGUAGE_CODES[language] || "hi-IN";

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const requestBody = {
    input: { text },
    voice: {
      languageCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3",
      pitch: 0,
      speakingRate: 0.9,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`TTS API error: ${errorData.error?.message}`);
    }

    const data = await response.json();
    return data.audioContent;
  } catch (error) {
    console.error("❌ Speech generation failed:", error);
    return null;
  }
}
