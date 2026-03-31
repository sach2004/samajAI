import { GoogleGenerativeAI } from "@google/generative-ai";
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

    // Process in smaller chunks to avoid truncation
    const chunkSize = 20; // Process 20 segments at a time
    const chunks = [];
    for (let i = 0; i < transcript.length; i += chunkSize) {
      chunks.push(transcript.slice(i, i + chunkSize));
    }

    console.log(`🔄 Processing ${chunks.length} chunks...`);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    let contextualizedTranscript = [];

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];

      console.log(`📝 Processing chunk ${chunkIndex + 1}/${chunks.length}...`);

      const prompt = `You are an expert educational content localizer specializing in Indian cultural contextualization.

TASK: Translate and recontextualize this English educational video transcript into ${languageName} for students in ${region}.

CRITICAL RULES:
1. PRESERVE EXACT TIMESTAMPS: Do NOT modify "start" or "duration" values AT ALL
2. Translate accurately to ${languageName}
3. Recontextualize examples to Indian context:
   - Currency: dollar to rupees, cents to paisa
   - Locations: Store/Walmart to Sabzi mandi/Kirana store, Restaurant to Dhaba/Local eatery
   - Food: Hamburger to Samosa/Vada pav, Apple pie to Gulab jamun, Pizza to Dosa, Apples to Mangoes
   - Names: John to Rahul, Sarah to Priya, Michael to Arjun, Emma to Anjali
   - Measurements: Fahrenheit to Celsius, miles to km, feet to meters, pounds to kg
   - Sports: Baseball to Cricket, American Football to Football/Cricket
   - Holidays: Thanksgiving to Diwali, Christmas to Holi, Halloween to Navratri
4. Keep educational concept identical - only change examples
5. Use natural, conversational language appropriate for ${region} students
6. Regional considerations: Urban regions - Modern shops, malls acceptable. Rural regions - Weekly haats, local markets, village context

INPUT TRANSCRIPT:
${JSON.stringify(chunk, null, 2)}

OUTPUT FORMAT: Return ONLY a valid JSON array. No markdown, no code blocks, no explanations, no extra text.
Format: [{"text": "translated text", "start": same_number, "duration": same_number}, ...]

CRITICAL: Your response must start with [ and end with ]. Include nothing else - no text before or after the JSON array.`;

      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        try {
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const responseText = response.text();

          console.log(`📦 Response length: ${responseText.length} chars`);

          // Clean the response more aggressively
          let jsonText = responseText.trim();

          // Remove markdown code blocks
          jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

          // Remove any text before the first [
          const firstBracket = jsonText.indexOf("[");
          if (firstBracket > 0) {
            jsonText = jsonText.substring(firstBracket);
          }

          // Remove any text after the last ]
          const lastBracket = jsonText.lastIndexOf("]");
          if (lastBracket > 0 && lastBracket < jsonText.length - 1) {
            jsonText = jsonText.substring(0, lastBracket + 1);
          }

          // Try to fix common JSON issues
          jsonText = jsonText
            .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
            .replace(/\n/g, " ") // Remove newlines
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim();

          // Validate it starts and ends correctly
          if (!jsonText.startsWith("[") || !jsonText.endsWith("]")) {
            throw new Error("Response does not start with [ or end with ]");
          }

          const chunkResult = JSON.parse(jsonText);

          if (!Array.isArray(chunkResult)) {
            throw new Error("Response is not an array");
          }

          // Validate each segment has required fields
          for (const seg of chunkResult) {
            if (
              !seg.text ||
              seg.start === undefined ||
              seg.duration === undefined
            ) {
              throw new Error("Segment missing required fields");
            }
          }

          contextualizedTranscript =
            contextualizedTranscript.concat(chunkResult);
          console.log(
            `✅ Chunk ${chunkIndex + 1} processed: ${
              chunkResult.length
            } segments`
          );
          success = true;
        } catch (parseError) {
          retries--;
          console.error(
            `❌ Chunk ${chunkIndex + 1} parse error (${retries} retries left):`,
            parseError.message
          );

          if (retries === 0) {
            // If all retries failed, try a fallback: keep original text but mark as translated
            console.warn(`⚠️ Using fallback for chunk ${chunkIndex + 1}`);
            const fallbackResult = chunk.map((seg) => ({
              text: `[Translation failed] ${seg.text}`,
              start: seg.start,
              duration: seg.duration,
            }));
            contextualizedTranscript =
              contextualizedTranscript.concat(fallbackResult);
          } else {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    }

    if (contextualizedTranscript.length === 0) {
      throw new Error("No segments were successfully processed");
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
}
