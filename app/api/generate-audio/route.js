import { LANGUAGE_CODES, VOICE_MAP } from "@/lib/constants";
import { NextResponse } from "next/server";

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

    // Generate audio for each segment
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
