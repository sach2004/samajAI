import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

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

    await prisma.analytics
      .create({
        data: {
          eventType: "error",
          metadata: {
            error: error.message,
            endpoint: "extract-transcript",
          },
        },
      })
      .catch(console.error);

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
