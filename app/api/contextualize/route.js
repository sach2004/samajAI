import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../../../lib/prisma";
import { LANGUAGE_NAMES } from "../../../lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { videoId, transcript, targetLanguage, region } = await request.json();

    // Check cache first
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
        const changes = await getChangesFromSession(video.id, targetLanguage, region);
        
        return NextResponse.json({
          contextualizedTranscript: video.transcripts[0].segments,
          changes,
          cached: true,
        });
      }
    } catch (cacheError) {
      console.log("⚠️ Cache check failed, proceeding with AI:", cacheError.message);
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

    console.log("✅ Contextualization complete:", contextualizedTranscript.length, "segments");

    const changes = detectChanges(transcript, contextualizedTranscript);

    // Save to database
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
      // Continue anyway, transcript is ready
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
    } catch (e) {
      // Ignore
    }

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
