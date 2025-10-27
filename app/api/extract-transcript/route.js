import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  try {
    const { videoUrl } = await request.json();
    
    console.log("📥 Received video URL:", videoUrl);

    const videoId = extractVideoId(videoUrl);
    
    console.log("🎬 Extracted video ID:", videoId);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Please provide a valid YouTube link." },
        { status: 400 }
      );
    }

    // Check database cache
    try {
      const existingVideo = await prisma.video.findUnique({
        where: { videoId },
        include: {
          transcripts: {
            where: { type: "original" },
          },
        },
      });

      if (existingVideo && existingVideo.transcripts.length > 0) {
        console.log("✅ Found cached transcript");
        return NextResponse.json({
          videoId,
          transcript: existingVideo.transcripts[0].segments,
          cached: true,
        });
      }
    } catch (dbError) {
      console.log("⚠️ Database check failed:", dbError.message);
    }

    // Fetch using TranscriptAPI.com
    const apiKey = process.env.TRANSCRIPT_API_KEY;
    
    if (!apiKey) {
      console.error("❌ TranscriptAPI key not configured");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    console.log("🔄 Fetching transcript from TranscriptAPI...");

    const transcriptUrl = `https://transcriptapi.com/api/v2/youtube/transcript?video_url=${videoId}&format=json&include_timestamp=true`;
    
    const response = await fetch(transcriptUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ TranscriptAPI error:", response.status, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: "No captions available for this video. Please choose a video with English captions." },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to fetch transcript from YouTube." },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    console.log("📦 TranscriptAPI response received");

    // Parse response
    let transcript = [];
    
    if (data && Array.isArray(data.transcript)) {
      transcript = data.transcript.map(segment => ({
        text: segment.text || '',
        start: parseFloat(segment.start) || 0,
        duration: parseFloat(segment.duration) || 0,
      }));
    } else {
      console.error("❌ Unexpected response format");
      return NextResponse.json(
        { error: "Failed to parse transcript data." },
        { status: 500 }
      );
    }

    console.log("✅ Parsed transcript:", transcript.length, "segments");

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: "No transcript data found." },
        { status: 404 }
      );
    }

    // Save to database
    try {
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
          segments: transcript,
        },
      });

      await prisma.analytics.create({
        data: {
          eventType: "transcript_extracted",
          videoId: video.id,
          metadata: {
            segmentCount: transcript.length,
          },
        },
      });

      console.log("💾 Saved to database");
    } catch (dbError) {
      console.error("⚠️ Database save failed:", dbError.message);
    }

    return NextResponse.json({
      videoId,
      transcript,
      cached: false,
    });

  } catch (error) {
    console.error("💥 Fatal error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to extract transcript" },
      { status: 500 }
    );
  }
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
