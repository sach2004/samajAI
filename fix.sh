#!/bin/bash

echo "🔥 Removing all @/ aliases..."

# Fix app/api/contextualize/route.js
cat > app/api/contextualize/route.js << 'EOF'
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../../../lib/prisma";
import { LANGUAGE_NAMES } from "../../../lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { videoId, transcript, targetLanguage, region } = await request.json();

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
      const changes = await getChangesFromSession(video.id, targetLanguage, region);
      
      return NextResponse.json({
        contextualizedTranscript: video.transcripts[0].segments,
        changes,
        cached: true,
      });
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

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
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

    let contextualizedTranscript;
    try {
      const jsonText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      contextualizedTranscript = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response text:", responseText);
      throw new Error("Failed to parse response. Please try again.");
    }

    if (!Array.isArray(contextualizedTranscript)) {
      throw new Error("Invalid response format");
    }

    const changes = detectChanges(transcript, contextualizedTranscript);

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
    }

    return NextResponse.json({
      contextualizedTranscript,
      changes,
      cached: false,
    });
  } catch (error) {
    console.error("Contextualization error:", error);

    await prisma.analytics.create({
      data: {
        eventType: "error",
        metadata: {
          error: error.message,
          endpoint: "contextualize",
        },
      },
    }).catch(console.error);

    return NextResponse.json(
      { error: error.message || "Failed to contextualize content" },
      { status: 500 }
    );
  }
}

async function getChangesFromSession(videoId, language, region) {
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
EOF

# Fix app/api/extract-transcript/route.js
cat > app/api/extract-transcript/route.js << 'EOF'
import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  try {
    const { videoUrl } = await request.json();

    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const existingVideo = await prisma.video.findUnique({
      where: { videoId },
      include: {
        transcripts: {
          where: { type: "original" },
        },
      },
    });

    if (existingVideo && existingVideo.transcripts.length > 0) {
      return NextResponse.json({
        videoId,
        transcript: existingVideo.transcripts[0].segments,
        cached: true,
      });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: "No transcript available for this video" },
        { status: 404 }
      );
    }

    const formattedTranscript = transcript.map((segment) => ({
      text: segment.text,
      start: segment.offset / 1000,
      duration: segment.duration / 1000,
    }));

    const video = await prisma.video.upsert({
      where: { videoId },
      update: { updatedAt: new Date() },
      create: {
        videoId,
        targetLanguage: "en",
        region: "global",
        status: "processing",
      },
    });

    await prisma.transcript.create({
      data: {
        videoId: video.id,
        type: "original",
        language: "en",
        segments: formattedTranscript,
      },
    });

    await prisma.analytics.create({
      data: {
        eventType: "transcript_extracted",
        videoId: video.id,
        metadata: {
          segmentCount: formattedTranscript.length,
        },
      },
    });

    return NextResponse.json({
      videoId,
      transcript: formattedTranscript,
      cached: false,
    });
  } catch (error) {
    console.error("Transcript extraction error:", error);

    await prisma.analytics.create({
      data: {
        eventType: "error",
        metadata: {
          error: error.message,
          endpoint: "extract-transcript",
        },
      },
    }).catch(console.error);

    return NextResponse.json(
      { error: error.message || "Failed to extract transcript" },
      { status: 500 }
    );
  }
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
EOF

# Fix app/api/generate-audio/route.js
cat > app/api/generate-audio/route.js << 'EOF'
import { NextResponse } from "next/server";
import { LANGUAGE_CODES, VOICE_MAP } from "../../../lib/constants";

export async function POST(request) {
  try {
    const { transcript, language } = await request.json();

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: "Invalid transcript format" },
        { status: 400 }
      );
    }

    const voiceName = VOICE_MAP[language] || "hi-IN-Wavenet-D";
    const languageCode = LANGUAGE_CODES[language] || "hi-IN";

    const audioSegments = await Promise.all(
      transcript.map(async (segment) => {
        try {
          const audioData = await generateAudioForSegment(
            segment.text,
            voiceName,
            languageCode
          );

          return {
            text: segment.text,
            start: segment.start,
            duration: segment.duration,
            audioBase64: audioData,
          };
        } catch (error) {
          console.error("Error generating audio for segment:", error);
          return {
            text: segment.text,
            start: segment.start,
            duration: segment.duration,
            audioBase64: null,
          };
        }
      })
    );

    return NextResponse.json({
      audioSegments,
      voiceName,
      languageCode,
    });
  } catch (error) {
    console.error("Audio generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate audio" },
      { status: 500 }
    );
  }
}

async function generateAudioForSegment(text, voiceName, languageCode) {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Cloud TTS API key not configured");
  }

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
      speakingRate: 0.95,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `TTS API error: ${errorData.error?.message || "Unknown error"}`
    );
  }

  const data = await response.json();
  return data.audioContent;
}
EOF

# Clean cache and restart
rm -rf .next

echo "✅ All @/ aliases removed!"
echo "Run: npm run dev"