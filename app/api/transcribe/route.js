import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("🎤 Transcribing audio with Whisper...");

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = audioFile.name || "audio.webm";

    const file = new File([buffer], fileName, { type: audioFile.type });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "hi",
    });

    console.log("✅ Transcription:", transcription.text);

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("💥 Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Transcription failed" },
      { status: 500 }
    );
  }
}
