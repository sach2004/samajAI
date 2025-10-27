"use client";

import { BookOpen, Download, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const LANGUAGE_NAMES = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
};

export default function VideoPlayerView({ videoData }) {
  const playerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const audioContextRef = useRef(null);
  const scheduledSourcesRef = useRef([]);
  const audioBuffersRef = useRef([]);
  const currentSegmentIndexRef = useRef(0);
  const lastPlayTimeRef = useRef(0);

  useEffect(() => {
    console.log("VideoPlayerView mounted", videoData.audioSegments?.length);

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      const newPlayer = new window.YT.Player(playerRef.current, {
        videoId: videoData.videoId,
        playerVars: {
          controls: 1,
          disablekb: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            console.log("YouTube player ready");
            event.target.mute();
            setPlayer(event.target);
          },
          onStateChange: (event) => {
            console.log("Player state:", event.data);

            if (event.data === 1) {
              // Playing
              setIsPlaying(true);
              const currentTime = event.target.getCurrentTime();
              if (Math.abs(currentTime - lastPlayTimeRef.current) > 1) {
                // User seeked
                stopAllAudio();
                currentSegmentIndexRef.current = findSegmentIndex(currentTime);
              }
              lastPlayTimeRef.current = currentTime;
              playAudioFromCurrentTime(event.target);
            } else if (event.data === 2) {
              // Paused
              setIsPlaying(false);
              stopAllAudio();
            } else if (event.data === 0) {
              // Ended
              setIsPlaying(false);
              setVideoEnded(true);
              stopAllAudio();
            }
          },
        },
      });
    };

    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    preloadAudio();

    return () => {
      stopAllAudio();
    };
  }, []);

  const findSegmentIndex = (currentTime) => {
    for (let i = 0; i < audioBuffersRef.current.length; i++) {
      const segment = audioBuffersRef.current[i];
      if (
        currentTime >= segment.start &&
        currentTime < segment.start + segment.duration
      ) {
        return i;
      }
    }
    return 0;
  };

  const preloadAudio = async () => {
    console.log("Preloading audio segments...");

    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    let loadedCount = 0;

    for (const segment of videoData.audioSegments) {
      if (!segment.audioBase64) {
        console.warn(
          "Missing audio for segment:",
          segment.text.substring(0, 30)
        );
        continue;
      }

      try {
        const audioData = atob(segment.audioBase64);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);

        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        audioBuffersRef.current.push({
          buffer: audioBuffer,
          start: segment.start,
          duration: segment.duration,
          text: segment.text,
        });

        loadedCount++;
      } catch (error) {
        console.error("Error decoding audio:", error);
      }
    }

    console.log(`✅ Loaded ${loadedCount} audio segments`);
    setAudioLoaded(true);
  };

  const playAudioFromCurrentTime = async (playerInstance) => {
    const activePlayer = playerInstance || player;

    if (!audioContextRef.current || !activePlayer) {
      console.error("Missing audio context or player");
      return;
    }

    if (audioBuffersRef.current.length === 0) {
      console.error("No audio buffers loaded");
      return;
    }

    stopAllAudio();

    const currentVideoTime = activePlayer.getCurrentTime();
    const audioContext = audioContextRef.current;

    console.log("🎵 Starting audio from:", currentVideoTime.toFixed(2));

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    // Find the current segment index
    let startIndex = currentSegmentIndexRef.current;
    for (let i = 0; i < audioBuffersRef.current.length; i++) {
      const segment = audioBuffersRef.current[i];
      if (
        currentVideoTime >= segment.start &&
        currentVideoTime < segment.start + segment.duration
      ) {
        startIndex = i;
        break;
      } else if (currentVideoTime < segment.start) {
        startIndex = i;
        break;
      }
    }

    currentSegmentIndexRef.current = startIndex;

    // Schedule only upcoming segments
    let cumulativeDelay = 0;
    for (let i = startIndex; i < audioBuffersRef.current.length; i++) {
      const audioData = audioBuffersRef.current[i];
      const segmentStartTime = audioData.start;

      // Calculate delay from current video time
      let delay = segmentStartTime - currentVideoTime;

      // If we're in the middle of a segment, play from the beginning
      if (
        i === startIndex &&
        currentVideoTime > segmentStartTime &&
        currentVideoTime < segmentStartTime + audioData.duration
      ) {
        delay = 0;
      }

      if (delay < 0 && i !== startIndex) {
        // Skip segments that have already passed
        continue;
      }

      try {
        const source = audioContext.createBufferSource();
        source.buffer = audioData.buffer;
        source.connect(audioContext.destination);

        const scheduledTime = audioContext.currentTime + Math.max(0, delay);

        source.start(scheduledTime);
        scheduledSourcesRef.current.push(source);

        console.log(
          `📢 Scheduled segment ${i}: "${audioData.text.substring(
            0,
            30
          )}" at +${delay.toFixed(2)}s`
        );

        // Set up next segment to play after this one ends
        source.onended = () => {
          currentSegmentIndexRef.current = i + 1;
        };
      } catch (error) {
        console.error("Error scheduling audio:", error);
      }
    }

    console.log(`✅ Scheduled ${scheduledSourcesRef.current.length} segments`);
  };

  const stopAllAudio = () => {
    scheduledSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    scheduledSourcesRef.current = [];
  };

  useEffect(() => {
    if (!player || !isPlaying) return;

    const interval = setInterval(() => {
      if (player.getCurrentTime) {
        const time = player.getCurrentTime();
        updateSubtitle(time);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, isPlaying]);

  const updateSubtitle = (time) => {
    const currentSegment = videoData.audioSegments.find(
      (seg) => time >= seg.start && time < seg.start + seg.duration
    );

    if (currentSegment) {
      setCurrentSubtitle(currentSegment.text);
    } else {
      setCurrentSubtitle("");
    }
  };

  const togglePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const restartVideo = () => {
    if (!player) return;

    stopAllAudio();
    currentSegmentIndexRef.current = 0;
    lastPlayTimeRef.current = 0;
    setVideoEnded(false);
    player.seekTo(0);
    player.playVideo();
  };

  const downloadSubtitles = () => {
    const srtContent = videoData.audioSegments
      .map((seg, index) => {
        const startTime = formatSRTTime(seg.start);
        const endTime = formatSRTTime(seg.start + seg.duration);
        return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
      })
      .join("\n");

    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subtitles_${videoData.language}.srt`;
    a.click();
  };

  const formatSRTTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-6 mb-6 bg-gradient-to-r from-orange-50 to-green-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Video Ready with Natural Indian Voice! 🎉
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {LANGUAGE_NAMES[videoData.language]}
              </Badge>
              <Badge variant="secondary">{videoData.region}</Badge>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {audioLoaded ? "Audio Ready" : "Loading Audio..."}
              </Badge>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {videoData.changes.currencyConversions}
              </div>
              <div className="text-gray-600">Currency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {videoData.changes.locationChanges}
              </div>
              <div className="text-gray-600">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {videoData.changes.measurementConversions}
              </div>
              <div className="text-gray-600">Measurements</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <div ref={playerRef} className="w-full h-full" />
        </div>

        {currentSubtitle && (
          <div className="bg-black/80 text-white px-6 py-4 rounded-lg text-center mb-4">
            <p className="text-xl leading-relaxed">{currentSubtitle}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2">
            <Button
              onClick={togglePlayPause}
              variant="default"
              size="lg"
              disabled={!audioLoaded}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Play
                </>
              )}
            </Button>

            <Button
              onClick={restartVideo}
              variant="outline"
              size="lg"
              disabled={!audioLoaded}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Restart
            </Button>

            {videoEnded && (
              <Button
                onClick={() => setShowQuiz(true)}
                variant="default"
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Start Quiz
              </Button>
            )}
          </div>

          <Button onClick={downloadSubtitles} variant="outline" size="lg">
            <Download className="w-5 h-5 mr-2" />
            Download Subtitles
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>🎙️ Natural Voice:</strong> Using Google Cloud WaveNet
            technology with authentic Indian accent in{" "}
            {LANGUAGE_NAMES[videoData.language]}, perfectly synced with video
            timeline.
          </p>
        </div>
      </Card>

      {showQuiz && (
        <Card className="p-6 mt-6 border-2 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900">
              📝 Test Your Knowledge
            </h3>
            <Button
              onClick={() => setShowQuiz(false)}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Quiz feature coming soon! This will generate AI-powered questions
              based on the video content in {LANGUAGE_NAMES[videoData.language]}
              .
            </p>
          </div>
        </Card>
      )}

      {videoData.changes.examples && videoData.changes.examples.length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-lg mb-4">
            Cultural Adaptations Made:
          </h3>
          <ul className="space-y-2">
            {videoData.changes.examples.map((example, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
