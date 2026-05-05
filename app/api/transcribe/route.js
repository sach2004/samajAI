import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");
    const targetLanguage = formData.get("language") || "hi"; // Get language for logging

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log(`🎤 Transcribing audio with Whisper (auto-detect language)...`);
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = audioFile.name || "audio.webm";
    const file = new File([buffer], fileName, { type: audioFile.type });

    // Whisper has limited language support - better to auto-detect
    // Supported: en, zh, de, es, ru, ko, fr, ja, pt, tr, pl, ca, nl, ar, sv, it, id, hi, fi, vi, he, uk, el, ms, cs, ro, da, hu, ta, no, th, ur, hr, bg, lt, la, mi, ml, cy, sk, te, fa, lv, bn, sr, az, sl, kn, et, mk, br, eu, is, hy, ne, mn, bs, kk, sq, sw, gl, mr, pa, si, km, sn, yo, so, af, oc, ka, be, tg, sd, gu, am, yi, lo, uz, fo, ht, ps, tk, nn, mt, sa, lb, my, bo, tl, mg, as, tt, haw, ln, ha, ba, jw, su

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      // language: "hi", // 🆕 REMOVED - Let Whisper auto-detect the language
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