"use client";

import {
  BookOpen,
  Download,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QuizView from "./QuizView";
import { Alert, AlertDescription } from "./ui/alert";
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
  const [audioError, setAudioError] = useState("");
  const [audioContextState, setAudioContextState] = useState("initializing");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const concatenatedBufferRef = useRef(null);
  const gainNodeRef = useRef(null);

  useEffect(() => {
    console.log("🎬 VideoPlayerView mounted");
    console.log("📦 Audio segments received:", videoData.audioSegments?.length);

    // Load YouTube IFrame API
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
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    };

    // Initialize audio context
    try {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      console.log("✅ Audio context created:", audioContextRef.current.state);
      setAudioContextState(audioContextRef.current.state);

      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 1.0;
      gainNodeRef.current.connect(audioContextRef.current.destination);

      // Preload and concatenate audio
      preloadAndConcatenateAudio();
    } catch (error) {
      console.error("❌ Failed to create audio context:", error);
      setAudioError("Failed to initialize audio system: " + error.message);
    }

    return () => {
      stopAudio();
    };
  }, []);

  const onPlayerReady = (event) => {
    console.log("✅ YouTube player ready");
    event.target.mute();
    setPlayer(event.target);
  };

  const onPlayerStateChange = (event) => {
    console.log("🎮 Player state changed:", event.data);

    if (event.data === 1) {
      // Playing
      setIsPlaying(true);

      // Try to play audio, with retry if not ready
      const attemptAudioPlay = () => {
        if (concatenatedBufferRef.current) {
          const currentVideoTime = event.target.getCurrentTime();
          playAudioFromTime(currentVideoTime);
        } else {
          console.warn("⚠️ Audio not ready yet, retrying in 500ms...");
          setTimeout(attemptAudioPlay, 500);
        }
      };

      attemptAudioPlay();
    } else if (event.data === 2) {
      // Paused
      setIsPlaying(false);
      stopAudio();
    } else if (event.data === 0) {
      // Ended
      setIsPlaying(false);
      setVideoEnded(true);
      stopAudio();
    }
  };

  const preloadAndConcatenateAudio = async () => {
    console.log("🔄 Preloading and concatenating audio segments...");

    if (!audioContextRef.current) {
      setAudioError("Audio context not initialized");
      return;
    }

    const audioContext = audioContextRef.current;
    const segments = videoData.audioSegments;

    if (!segments || segments.length === 0) {
      setAudioError("No audio segments found");
      return;
    }

    try {
      // Step 1: Decode all audio segments
      const audioSegments = [];
      let failedSegments = 0;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        if (!segment.audioBase64) {
          console.warn(
            `⚠️ Segment ${i} missing audio:`,
            segment.text.substring(0, 30)
          );
          failedSegments++;
          continue;
        }

        try {
          const audioData = atob(segment.audioBase64);
          const arrayBuffer = new ArrayBuffer(audioData.length);
          const view = new Uint8Array(arrayBuffer);

          for (let j = 0; j < audioData.length; j++) {
            view[j] = audioData.charCodeAt(j);
          }

          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          audioSegments.push({
            buffer: audioBuffer,
            originalStart: segment.start, // Keep for subtitle sync
            originalDuration: segment.duration,
            actualDuration: audioBuffer.duration, // Use REAL audio duration
            text: segment.text,
          });

          if ((i + 1) % 10 === 0) {
            console.log(`📥 Decoded ${i + 1}/${segments.length} segments`);
          }
        } catch (error) {
          console.error(`❌ Error decoding segment ${i}:`, error);
          failedSegments++;
        }
      }

      console.log(
        `✅ Decoded ${audioSegments.length} audio segments (${failedSegments} failed)`
      );

      if (audioSegments.length === 0) {
        setAudioError("Failed to decode any audio segments");
        return;
      }

      // Step 2: Calculate total duration based on ACTUAL audio lengths
      // Place segments sequentially with small gaps
      let totalDuration = 0;
      const gapBetweenSegments = 0.15; // 150ms natural pause between sentences

      audioSegments.forEach((segment, index) => {
        segment.newStart = totalDuration; // New sequential position
        totalDuration += segment.actualDuration + gapBetweenSegments;
      });

      console.log(`📊 Total audio duration: ${totalDuration.toFixed(2)}s`);

      const sampleRate = audioContext.sampleRate;
      const numberOfChannels = audioSegments[0].buffer.numberOfChannels;
      const totalSamples = Math.ceil(totalDuration * sampleRate);

      console.log(`📊 Creating concatenated buffer:`, {
        duration: totalDuration.toFixed(2) + "s",
        sampleRate: sampleRate + "Hz",
        channels: numberOfChannels,
        samples: totalSamples,
        segments: audioSegments.length,
      });

      // Step 3: Create buffer with total duration
      const concatenatedBuffer = audioContext.createBuffer(
        numberOfChannels,
        totalSamples,
        sampleRate
      );

      // Step 4: Copy each segment at its NEW sequential position
      for (const segment of audioSegments) {
        const startSample = Math.floor(segment.newStart * sampleRate);

        for (let channel = 0; channel < numberOfChannels; channel++) {
          const inputData = segment.buffer.getChannelData(channel);
          const outputData = concatenatedBuffer.getChannelData(channel);

          // Apply crossfade for smooth transitions
          const crossfadeSamples = Math.min(960, inputData.length / 10); // 20ms fade

          for (let i = 0; i < inputData.length; i++) {
            if (startSample + i >= totalSamples) break;

            let sample = inputData[i];

            // Fade in at start
            if (i < crossfadeSamples) {
              sample *= i / crossfadeSamples;
            }

            // Fade out at end
            if (i > inputData.length - crossfadeSamples) {
              sample *= (inputData.length - i) / crossfadeSamples;
            }

            outputData[startSample + i] = sample;
          }
        }
      }

      concatenatedBufferRef.current = concatenatedBuffer;

      // Store mapping for subtitle sync (original time → new audio time)
      window.audioSegmentMapping = audioSegments.map((seg) => ({
        originalStart: seg.originalStart,
        originalEnd: seg.originalStart + seg.originalDuration,
        newStart: seg.newStart,
        newEnd: seg.newStart + seg.actualDuration,
        text: seg.text,
      }));

      console.log(`🎵 ✅ Audio buffer ready:`, {
        duration: concatenatedBuffer.duration.toFixed(2) + "s",
        channels: concatenatedBuffer.numberOfChannels,
        sampleRate: concatenatedBuffer.sampleRate,
        segments: audioSegments.length,
      });

      console.log(`📍 Sample mapping:`, window.audioSegmentMapping.slice(0, 3));

      setAudioLoaded(true);
      setAudioError("");
    } catch (error) {
      console.error("❌ Fatal error in audio processing:", error);
      setAudioError("Failed to process audio: " + error.message);
    }
  };

  const ensureAudioContextRunning = async () => {
    if (!audioContextRef.current) return false;

    const audioContext = audioContextRef.current;

    if (audioContext.state === "suspended") {
      console.log("🔓 Resuming suspended audio context...");
      try {
        await audioContext.resume();
        console.log("✅ Audio context resumed, state:", audioContext.state);
        setAudioContextState(audioContext.state);
        return true;
      } catch (error) {
        console.error("❌ Failed to resume audio context:", error);
        setAudioError("Failed to start audio: " + error.message);
        return false;
      }
    }

    return true;
  };

  const playAudioFromTime = async (startTime) => {
    console.log(
      "🎵 playAudioFromTime called, video time:",
      startTime.toFixed(2)
    );

    if (!audioContextRef.current) {
      console.error("❌ No audio context");
      setAudioError("Audio context not initialized");
      return;
    }

    if (!concatenatedBufferRef.current) {
      console.error("❌ No audio buffer");
      setAudioError("Audio buffer not loaded");
      return;
    }

    if (!gainNodeRef.current) {
      console.error("❌ No gain node");
      setAudioError("Audio output not configured");
      return;
    }

    // Stop any existing audio
    stopAudio();

    // Ensure audio context is running
    const isRunning = await ensureAudioContextRunning();
    if (!isRunning) return;

    const audioContext = audioContextRef.current;

    try {
      // Create new source
      const source = audioContext.createBufferSource();
      source.buffer = concatenatedBufferRef.current;

      // Connect source → gain → destination
      source.connect(gainNodeRef.current);

      console.log("🔊 Audio chain connected: source → gain → destination");

      // Find corresponding audio time based on video time using mapping
      let audioOffset = 0;

      if (window.audioSegmentMapping && startTime > 0) {
        // Find which segment the video is at
        const currentSegment = window.audioSegmentMapping.find(
          (seg) => startTime >= seg.originalStart && startTime < seg.originalEnd
        );

        if (currentSegment) {
          // Start from the beginning of this audio segment
          audioOffset = currentSegment.newStart;
          console.log(
            `📍 Video at ${startTime.toFixed(
              2
            )}s → Audio segment starts at ${audioOffset.toFixed(2)}s`
          );
        } else {
          // If between segments, find the next segment
          const nextSegment = window.audioSegmentMapping.find(
            (seg) => seg.originalStart > startTime
          );
          if (nextSegment) {
            audioOffset = nextSegment.newStart;
            console.log(
              `📍 Video at ${startTime.toFixed(
                2
              )}s → Next audio segment at ${audioOffset.toFixed(2)}s`
            );
          }
        }
      }

      // Calculate remaining duration
      const duration = concatenatedBufferRef.current.duration - audioOffset;

      if (duration <= 0) {
        console.warn("⚠️ No audio left to play at this time");
        return;
      }

      // Start playing
      source.start(0, audioOffset, duration);
      audioSourceRef.current = source;
      setIsAudioPlaying(true);

      console.log(
        `▶️ 🔊 AUDIO PLAYING from ${audioOffset.toFixed(
          2
        )}s (${duration.toFixed(2)}s remaining)`
      );
      console.log(
        "🔊 Buffer duration:",
        concatenatedBufferRef.current.duration.toFixed(2) + "s"
      );
      console.log("🔊 Gain value:", gainNodeRef.current.gain.value);
      console.log("🔊 Audio context state:", audioContext.state);

      // Handle when audio ends naturally
      source.onended = () => {
        console.log("🏁 Audio playback ended");
        audioSourceRef.current = null;
        setIsAudioPlaying(false);
      };
    } catch (error) {
      console.error("❌ Error starting audio playback:", error);
      setAudioError("Failed to play audio: " + error.message);
      setIsAudioPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        console.log("⏹️ Audio stopped");
      } catch (e) {
        // Already stopped
      }
      audioSourceRef.current = null;
      setIsAudioPlaying(false);
    }
  };

  const testAudio = async () => {
    console.log("🧪 Testing audio output...");

    if (!audioContextRef.current) {
      alert("Audio context not initialized!");
      return;
    }

    await ensureAudioContextRunning();

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const testGain = audioContext.createGain();

    oscillator.connect(testGain);
    testGain.connect(audioContext.destination);

    oscillator.frequency.value = 440; // A4 note
    testGain.gain.value = 0.3;

    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      console.log("✅ Test tone played");
    }, 500);
  };

  // Update subtitles
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
    // If we have audio playing, calculate the current audio position
    let audioTime = 0;

    if (audioSourceRef.current && audioContextRef.current) {
      const timeSinceStart = audioContextRef.current.currentTime;
      audioTime = time; // We'll sync based on when audio started
    }

    // Find which segment should be showing based on the audio mapping
    if (window.audioSegmentMapping) {
      const currentSegment = window.audioSegmentMapping.find((seg) => {
        // Check if current video time falls in the ORIGINAL segment timing
        return time >= seg.originalStart && time < seg.originalEnd;
      });

      if (currentSegment) {
        setCurrentSubtitle(currentSegment.text);
      } else {
        setCurrentSubtitle("");
      }
    } else {
      // Fallback to original method
      const currentSegment = videoData.audioSegments.find(
        (seg) => time >= seg.start && time < seg.start + seg.duration
      );

      if (currentSegment) {
        setCurrentSubtitle(currentSegment.text);
      } else {
        setCurrentSubtitle("");
      }
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

    stopAudio();
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
      {audioError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            <strong>Audio Error:</strong> {audioError}
            <Button
              onClick={testAudio}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              Test Audio
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
                className={
                  audioLoaded
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              >
                {audioLoaded ? "✅ Audio Ready" : "⏳ Loading..."}
              </Badge>
              <Badge variant="outline">
                {isAudioPlaying ? (
                  <Volume2 className="w-3 h-3 mr-1" />
                ) : (
                  <VolumeX className="w-3 h-3 mr-1" />
                )}
                {isAudioPlaying ? "Playing" : "Silent"}
              </Badge>
              <Badge variant="outline">Context: {audioContextState}</Badge>
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

            <Button onClick={testAudio} variant="outline" size="lg">
              🔊 Test Audio
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
            <strong>🎙️ Audio Status:</strong>{" "}
            {audioLoaded ? "Ready" : "Loading..."} • Context:{" "}
            {audioContextState} •
            {isAudioPlaying ? " 🔊 Audio Playing" : " 🔇 Audio Silent"}
          </p>
        </div>
      </Card>

      {showQuiz && (
        <div className="mt-6">
          <QuizView
            transcript={videoData.contextualizedTranscript}
            language={videoData.language}
            onClose={() => setShowQuiz(false)}
          />
        </div>
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
