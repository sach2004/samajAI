#!/bin/bash

# 🔧 ULTIMATE FIX SCRIPT - ONE COMMAND TO FIX EVERYTHING
# Just run: ./ultimate-fix.sh

echo "🚀 Starting Ultimate Fix..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Run this from your project root directory!${NC}"
    exit 1
fi

echo -e "${BLUE}📂 Found project root${NC}"
echo ""

# Function to create/fix a file
fix_file() {
    local filepath=$1
    local content=$2
    
    mkdir -p "$(dirname "$filepath")"
    echo "$content" > "$filepath"
    echo -e "${GREEN}✅ Fixed: $filepath${NC}"
}

echo -e "${YELLOW}🔄 Fixing all API routes...${NC}"
echo ""

# Fix 1: contextualize/route.js
fix_file "app/api/contextualize/route.js" 'import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { LANGUAGE_NAMES } from "../../../lib/constants";
import { prisma } from "../../../lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { videoId, transcript, targetLanguage, region } =
      await request.json();

    try {
      const video = await prisma.video.findUnique({
        where: { videoId },
        include: {
          transcripts: {
            where: {
              type: "contextualized",
              language: targetLanguage,
            },
          },
        },
      });

      if (video && video.transcripts.length > 0) {
        console.log("✅ Using cached contextualized transcript");
        const changes = await getChangesFromSession(
          video.id,
          targetLanguage,
          region
        );

        return NextResponse.json({
          contextualizedTranscript: video.transcripts[0].segments,
          changes,
          cached: true,
        });
      }
    } catch (cacheError) {
      console.log(
        "⚠️ Cache check failed, proceeding with AI:",
        cacheError.message
      );
    }

    const languageName = LANGUAGE_NAMES[targetLanguage] || "Hindi";

    const prompt = `You are an expert educational content localizer specializing in Indian cultural contextualization.

TASK: Translate and recontextualize this English educational video transcript into ${languageName} for students in ${region}.

CRITICAL RULES:
1. **PRESERVE EXACT TIMESTAMPS**: Do NOT modify "start" or "duration" values AT ALL
2. **Translate accurately** to ${languageName}
3. **Recontextualize examples** to Indian context:
   - Currency: $ → ₹, dollars → rupees, cents → paisa
   - Locations: Store/Walmart → Sabzi mandi/Kirana store, Restaurant → Dhaba/Local eatery
   - Food: Hamburger → Samosa/Vada pav, Apple pie → Gulab jamun, Pizza → Dosa, Apples → Mangoes
   - Names: John → Rahul, Sarah → Priya, Michael → Arjun, Emma → Anjali
   - Measurements: °F → °C, miles → km, feet → meters, pounds → kg
   - Sports: Baseball → Cricket, American Football → Football/Cricket
   - Holidays: Thanksgiving → Diwali, Christmas → Holi, Halloween → Navratri
4. **Keep educational concept identical** - only change examples
5. **Use natural, conversational language** appropriate for ${region} students
6. **Regional considerations**:
   - Urban regions: Modern shops, malls acceptable
   - Rural regions: Weekly haats, local markets, village context

INPUT TRANSCRIPT:
${JSON.stringify(transcript, null, 2)}

OUTPUT FORMAT: Return ONLY a valid JSON array. No markdown, no code blocks, no explanations.
[{
  "text": "translated and contextualized text in ${languageName}",
  "start": <EXACT same number as input>,
  "duration": <EXACT same number as input>
}, ...]

CRITICAL: Start your response with [ and end with ]. No other text.`;

    console.log("🤖 Calling Gemini AI for contextualization...");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log("📝 Received Gemini response");

    let contextualizedTranscript;
    try {
      const jsonText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      contextualizedTranscript = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      console.error("Response text:", responseText.substring(0, 500));
      throw new Error("Failed to parse AI response. Please try again.");
    }

    if (!Array.isArray(contextualizedTranscript)) {
      throw new Error("Invalid response format from AI");
    }

    console.log(
      "✅ Contextualization complete:",
      contextualizedTranscript.length,
      "segments"
    );

    const changes = detectChanges(transcript, contextualizedTranscript);

    try {
      const video = await prisma.video.findUnique({
        where: { videoId },
      });

      if (video) {
        await prisma.transcript.create({
          data: {
            videoId: video.id,
            type: "contextualized",
            language: targetLanguage,
            segments: contextualizedTranscript,
          },
        });

        await prisma.video.update({
          where: { id: video.id },
          data: {
            targetLanguage,
            region,
            status: "completed",
          },
        });

        const processingTime = Date.now() - startTime;
        await prisma.processingSession.create({
          data: {
            videoId: video.id,
            targetLanguage,
            region,
            currencyConversions: changes.currencyConversions,
            locationChanges: changes.locationChanges,
            measurementConversions: changes.measurementConversions,
            culturalAdaptations: changes.culturalAdaptations,
            processingTimeMs: processingTime,
            transcriptLength: transcript.length,
            status: "completed",
            completedAt: new Date(),
          },
        });

        await prisma.analytics.create({
          data: {
            eventType: "video_processed",
            videoId: video.id,
            language: targetLanguage,
            region,
            metadata: {
              processingTimeMs: processingTime,
              changes,
            },
          },
        });

        console.log("💾 Saved contextualized transcript to database");
      }
    } catch (dbError) {
      console.error("⚠️ Database save failed:", dbError.message);
    }

    return NextResponse.json({
      contextualizedTranscript,
      changes,
      cached: false,
    });
  } catch (error) {
    console.error("💥 Contextualization error:", error);

    try {
      await prisma.analytics.create({
        data: {
          eventType: "error",
          metadata: {
            error: error.message,
            endpoint: "contextualize",
          },
        },
      });
    } catch (e) {}

    return NextResponse.json(
      { error: error.message || "Failed to contextualize content" },
      { status: 500 }
    );
  }
}

async function getChangesFromSession(videoId, language, region) {
  try {
    const session = await prisma.processingSession.findFirst({
      where: {
        videoId,
        targetLanguage: language,
        region,
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
    });

    if (session) {
      return {
        languageChange: `English → ${language}`,
        currencyConversions: session.currencyConversions,
        locationChanges: session.locationChanges,
        measurementConversions: session.measurementConversions,
        culturalAdaptations: session.culturalAdaptations,
        examples: [],
      };
    }
  } catch (error) {
    console.error("Error fetching session:", error.message);
  }

  return {
    languageChange: `English → ${language}`,
    currencyConversions: 0,
    locationChanges: 0,
    measurementConversions: 0,
    culturalAdaptations: 0,
    examples: [],
  };
}

function detectChanges(original, contextualized) {
  const changes = {
    languageChange: "English → Target Language",
    currencyConversions: 0,
    locationChanges: 0,
    measurementConversions: 0,
    culturalAdaptations: 0,
    examples: [],
  };

  const currencyPattern = /\$|dollar|cent|euro|pound|gbp/i;
  const locationPattern = /store|walmart|target|mall|restaurant|library/i;
  const measurementPattern = /fahrenheit|°f|mile|feet|foot|pound|lb/i;

  for (let i = 0; i < Math.min(original.length, contextualized.length); i++) {
    const origText = original[i].text.toLowerCase();

    if (currencyPattern.test(origText)) {
      changes.currencyConversions++;
      if (changes.examples.length < 5) {
        changes.examples.push(`Currency adapted to ₹`);
      }
    }

    if (locationPattern.test(origText)) {
      changes.locationChanges++;
      if (changes.examples.length < 5) {
        changes.examples.push(`Location adapted to Indian context`);
      }
    }

    if (measurementPattern.test(origText)) {
      changes.measurementConversions++;
      if (changes.examples.length < 5) {
        changes.examples.push(`Measurement converted to metric`);
      }
    }
  }

  changes.culturalAdaptations =
    changes.currencyConversions +
    changes.locationChanges +
    changes.measurementConversions;

  return changes;
}'

# Fix 2: contextualize-pdf/route.js
fix_file "app/api/contextualize-pdf/route.js" 'import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { LANGUAGE_NAMES } from "../../../lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { text, targetLanguage, region } = await request.json();
    const languageName = LANGUAGE_NAMES[targetLanguage];

    console.log(`🤖 Contextualizing ${text.length} chars to ${languageName}`);

    const prompt = `Translate this English educational content to ${languageName} for ${region} students. Adapt cultural examples:
- Currency: $ → ₹, dollars → rupees
- Locations: Store → Sabzi mandi, Mall → Shopping complex, Restaurant → Dhaba
- Food: Hamburger → Samosa, Pizza → Dosa, Apple → Mango
- Names: John → Rahul, Sarah → Priya, Michael → Arjun
- Measurements: °F → °C, miles → km, feet → meters

Keep educational concepts identical, only change examples.

TEXT:
${text}

Return ONLY the translated text in ${languageName}.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    });

    const result = await model.generateContent(prompt);
    const contextualizedText = result.response.text();

    console.log("✅ Contextualized:", contextualizedText.length, "chars");

    const changes = {
      currencyConversions: (text.match(/\$|dollar/gi) || []).length,
      locationChanges: (text.match(/store|mall|restaurant/gi) || []).length,
      measurementConversions: (text.match(/fahrenheit|mile|feet|pound/gi) || [])
        .length,
      culturalAdaptations: 0,
      examples: [],
    };

    changes.culturalAdaptations =
      changes.currencyConversions +
      changes.locationChanges +
      changes.measurementConversions;

    if (changes.currencyConversions > 0)
      changes.examples.push(
        `${changes.currencyConversions} currency conversions to ₹`
      );
    if (changes.locationChanges > 0)
      changes.examples.push(`${changes.locationChanges} locations adapted`);
    if (changes.measurementConversions > 0)
      changes.examples.push(
        `${changes.measurementConversions} measurements converted`
      );

    return NextResponse.json({ contextualizedText, changes });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}'

# Fix 3: generate-quiz/route.js
fix_file "app/api/generate-quiz/route.js" 'import { GoogleGenerativeAI } from "@google/generative-ai";
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
}'

# Fix 4: text-chatbot/route.js
fix_file "app/api/text-chatbot/route.js" 'import { GoogleGenerativeAI } from "@google/generative-ai";
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

STUDENT'\''S QUESTION (in ${languageName}):
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
}'

# Fix 5: voice-teacher/route.js
fix_file "app/api/voice-teacher/route.js" 'import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { LANGUAGE_NAMES } from "../../../lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

    const videoSummary = videoContext.transcript
      .slice(0, 20)
      .map((seg) => seg.text)
      .join(" ")
      .substring(0, 1000);

    const prompt = `You are a warm, encouraging Indian teacher (Guru ji/Madam) teaching students in ${languageName}. A student just watched an educational video and has a doubt.

VIDEO SUMMARY:
${videoSummary}
${conversationContext}

STUDENT'\''S QUESTION (in ${languageName}):
"${question}"

TEACHING GUIDELINES:
1. **Speak in natural, conversational ${languageName}** - like a friendly neighborhood teacher
2. **Be warm and encouraging** - Use phrases like "बहुत अच्छा सवाल!", "समझ में आ रहा है ना?", "चलिए समझते हैं"
3. **Use culturally relevant Indian examples**:
   - Everyday life: chai, cricket, trains, festivals, family
   - Local context: sabzi mandi, school, mohalla, village
   - Regional foods: dosa, samosa, biryani, mithai
4. **Keep answers concise** (3-5 sentences) - this will be spoken aloud
5. **Check understanding** - End with a gentle question or encouragement
6. **Use simple language** - Avoid heavy technical jargon
7. **Be patient and supportive** - Students learn at different paces

IMPORTANT: Respond ONLY in ${languageName}. Keep it short for voice output (max 150 words).`;

    console.log("🤖 Calling Gemini for teacher response...");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      },
    });

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

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
}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ ALL FILES FIXED!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "  ✅ Fixed: app/api/contextualize/route.js"
echo "  ✅ Fixed: app/api/contextualize-pdf/route.js"
echo "  ✅ Fixed: app/api/generate-quiz/route.js"
echo "  ✅ Fixed: app/api/text-chatbot/route.js"
echo "  ✅ Fixed: app/api/voice-teacher/route.js"
echo ""
echo -e "${YELLOW}🔄 Changed model from:${NC} gemini-1.5-flash-latest"
echo -e "${GREEN}✅ Changed model to:${NC}   gemini-2.0-flash-exp"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🚀 NOW RESTART YOUR SERVER:${NC}"
echo "   npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 DONE! Your app should work now!${NC}"
