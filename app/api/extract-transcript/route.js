import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  try {
    const { videoUrl } = await request.json();
    
    console.log("Received video URL:", videoUrl);

    const videoId = extractVideoId(videoUrl);
    
    console.log("Extracted video ID:", videoId);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Check database cache
    const existingVideo = await prisma.video.findUnique({
      where: { videoId },
      include: {
        transcripts: {
          where: { type: "original" },
        },
      },
    });

    if (existingVideo && existingVideo.transcripts.length > 0) {
      console.log("Found cached transcript");
      return NextResponse.json({
        videoId,
        transcript: existingVideo.transcripts[0].segments,
        cached: true,
      });
    }

    // Fetch captions using YouTube Data API v3
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error("YouTube API key not configured");
    }

    // Get caption track ID
    const captionsListUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`;
    
    const captionsListResponse = await fetch(captionsListUrl);
    
    if (!captionsListResponse.ok) {
      throw new Error("Failed to fetch captions list from YouTube");
    }

    const captionsData = await captionsListResponse.json();
    
    console.log("Captions data:", captionsData);

    if (!captionsData.items || captionsData.items.length === 0) {
      return NextResponse.json(
        { error: "No captions available for this video. Please choose a video with English captions." },
        { status: 404 }
      );
    }

    // Find English caption track
    const englishCaption = captionsData.items.find(
      item => item.snippet.language === 'en' || 
              item.snippet.language === 'en-US' ||
              item.snippet.language === 'en-GB'
    ) || captionsData.items[0];

    console.log("Using caption track:", englishCaption.id);

    // Download caption using timedtext API
    const captionUrl = `https://www.youtube.com/api/timedtext?lang=${englishCaption.snippet.language}&v=${videoId}`;
    
    const captionResponse = await fetch(captionUrl);
    
    if (!captionResponse.ok) {
      throw new Error("Failed to download captions");
    }

    const captionXML = await captionResponse.text();
    
    console.log("Caption XML fetched, length:", captionXML.length);

    // Parse XML to extract transcript
    const transcript = parseYouTubeCaptions(captionXML);

    console.log("Parsed transcript:", transcript.length, "segments");

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: "Failed to parse captions" },
        { status: 404 }
      );
    }

    // Save to database
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

    return NextResponse.json({
      videoId,
      transcript,
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

function parseYouTubeCaptions(xml) {
  const transcript = [];
  
  // Parse XML manually (simple regex approach)
  const textMatches = xml.matchAll(/<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]+)<\/text>/g);
  
  for (const match of textMatches) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    let text = match[3];
    
    // Decode HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, ''); // Remove any HTML tags
    
    transcript.push({
      text: text.trim(),
      start,
      duration,
    });
  }
  
  return transcript;
}
