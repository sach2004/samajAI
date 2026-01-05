import { NextResponse } from "next/server";

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
  hi: { male: "hi-IN-Wavenet-B", female: "hi-IN-Wavenet-D" },
  ta: { male: "ta-IN-Wavenet-B", female: "ta-IN-Wavenet-A" },
  te: { male: "te-IN-Standard-B", female: "te-IN-Standard-A" },
  bn: { male: "bn-IN-Wavenet-B", female: "bn-IN-Wavenet-A" },
  kn: { male: "kn-IN-Wavenet-B", female: "kn-IN-Wavenet-A" },
  ml: { male: "ml-IN-Wavenet-B", female: "ml-IN-Wavenet-A" },
  gu: { male: "gu-IN-Wavenet-B", female: "gu-IN-Wavenet-A" },
  mr: { male: "mr-IN-Wavenet-B", female: "mr-IN-Wavenet-A" },
};

export async function POST(request) {
  try {
    const { transcript, language, voiceGender } = await request.json();

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: "Invalid transcript format" },
        { status: 400 }
      );
    }

    const gender = voiceGender || "female";
    const voiceName = VOICE_MAP[language]?.[gender] || "hi-IN-Wavenet-D";
    const languageCode = LANGUAGE_CODES[language] || "hi-IN";

    console.log(`🎙️ Using ${gender} voice: ${voiceName}`);

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
