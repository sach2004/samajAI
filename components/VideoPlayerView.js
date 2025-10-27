"use client";

import {
  BookOpen,
  Download,
  MessageCircle,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QuizView from "./QuizView";
import RegionalChatbot from "./RegionalChatbot";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import VoiceTeacher from "./VoiceTeacher";

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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showVoiceTeacher, setShowVoiceTeacher] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotMinimized, setChatbotMinimized] = useState(true);

  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const concatenatedBufferRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioStartTimeRef = useRef(0);
  const audioStartOffsetRef = useRef(0);

  useEffect(() => {
    console.log("🎬 VideoPlayerView mounted");

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

    try {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 1.0;
      gainNodeRef.current.connect(audioContextRef.current.destination);
      preloadAndConcatenateAudio();
    } catch (error) {
      console.error("❌ Failed to create audio context:", error);
      setAudioError("Failed to initialize audio: " + error.message);
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
    if (event.data === 1) {
      setIsPlaying(true);
      const attemptAudioPlay = () => {
        if (concatenatedBufferRef.current) {
          playAudioFromTime(0);
        } else {
          console.warn("⚠️ Audio not ready, retrying...");
          setTimeout(attemptAudioPlay, 500);
        }
      };
      attemptAudioPlay();
    } else if (event.data === 2) {
      setIsPlaying(false);
      stopAudio();
    } else if (event.data === 0) {
      setIsPlaying(false);
      setVideoEnded(true);
      stopAudio();
    }
  };

  const preloadAndConcatenateAudio = async () => {
    console.log("🔄 Preloading audio...");

    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const segments = videoData.audioSegments;

    try {
      const audioSegments = [];

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (!segment.audioBase64) continue;

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
            originalStart: segment.start,
            text: segment.text,
          });

          if ((i + 1) % 10 === 0) {
            console.log(`📥 Decoded ${i + 1}/${segments.length}`);
          }
        } catch (error) {
          console.error(`❌ Segment ${i} failed:`, error);
        }
      }

      let totalDuration = 0;
      const gap = 0.1;

      audioSegments.forEach((seg) => {
        seg.newStart = totalDuration;
        totalDuration += seg.buffer.duration + gap;
      });

      const sampleRate = audioContext.sampleRate;
      const channels = audioSegments[0].buffer.numberOfChannels;
      const totalSamples = Math.ceil(totalDuration * sampleRate);

      const concatenatedBuffer = audioContext.createBuffer(
        channels,
        totalSamples,
        sampleRate
      );

      for (const seg of audioSegments) {
        const startSample = Math.floor(seg.newStart * sampleRate);
        for (let ch = 0; ch < channels; ch++) {
          const input = seg.buffer.getChannelData(ch);
          const output = concatenatedBuffer.getChannelData(ch);

          const fade = Math.min(480, input.length / 10);
          for (let i = 0; i < input.length; i++) {
            if (startSample + i >= totalSamples) break;
            let sample = input[i];
            if (i < fade) sample *= i / fade;
            if (i > input.length - fade) sample *= (input.length - i) / fade;
            output[startSample + i] = sample;
          }
        }
      }

      concatenatedBufferRef.current = concatenatedBuffer;

      window.audioSegmentMapping = audioSegments.map((seg) => ({
        newStart: seg.newStart,
        newEnd: seg.newStart + seg.buffer.duration,
        text: seg.text,
      }));

      console.log(
        `✅ Audio ready: ${totalDuration.toFixed(2)}s, ${
          audioSegments.length
        } segments`
      );
      setAudioLoaded(true);
    } catch (error) {
      console.error("❌ Audio processing failed:", error);
      setAudioError("Failed to process audio: " + error.message);
    }
  };

  const playAudioFromTime = async (startOffset) => {
    if (
      !audioContextRef.current ||
      !concatenatedBufferRef.current ||
      !gainNodeRef.current
    ) {
      console.error("❌ Audio not ready");
      return;
    }

    stopAudio();

    const audioContext = audioContextRef.current;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    try {
      const source = audioContext.createBufferSource();
      source.buffer = concatenatedBufferRef.current;
      source.connect(gainNodeRef.current);

      const duration = concatenatedBufferRef.current.duration - startOffset;
      if (duration <= 0) return;

      source.start(0, startOffset, duration);
      audioSourceRef.current = source;

      audioStartTimeRef.current = audioContext.currentTime;
      audioStartOffsetRef.current = startOffset;

      setIsAudioPlaying(true);

      console.log(`▶️ Playing audio from ${startOffset.toFixed(2)}s`);

      source.onended = () => {
        audioSourceRef.current = null;
        setIsAudioPlaying(false);
      };
    } catch (error) {
      console.error("❌ Playback error:", error);
      setAudioError("Playback failed: " + error.message);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {
        // Already stopped
      }
      audioSourceRef.current = null;
      setIsAudioPlaying(false);
    }
  };

  useEffect(() => {
    if (!isAudioPlaying || !audioContextRef.current) return;

    const interval = setInterval(() => {
      const elapsed =
        audioContextRef.current.currentTime - audioStartTimeRef.current;
      const currentAudioTime = audioStartOffsetRef.current + elapsed;

      if (window.audioSegmentMapping) {
        const segment = window.audioSegmentMapping.find(
          (seg) =>
            currentAudioTime >= seg.newStart && currentAudioTime < seg.newEnd
        );
        setCurrentSubtitle(segment ? segment.text : "");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isAudioPlaying]);

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
          <AlertDescription>{audioError}</AlertDescription>
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
          <div className="flex gap-2 flex-wrap">
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

            <Button
              onClick={() => setShowVoiceTeacher(true)}
              variant="secondary"
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600"
            >
              <Mic className="w-5 h-5 mr-2" />
              🎤 Talk to Teacher
            </Button>

            {videoEnded && (
              <Button
                onClick={() => setShowQuiz(true)}
                variant="default"
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
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

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-black">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground mb-2">
                <strong>🎙️ New!</strong> Voice & Chat Features:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 font-bold">
                <li>
                  • 🎤 Talk to AI teacher in{" "}
                  {LANGUAGE_NAMES[videoData.language]}
                </li>
                <li>• 💬 Type questions and get instant answers</li>
                <li>
                  • 🔊 {isAudioPlaying ? "Playing" : "Silent"} - Natural voice
                  narration
                </li>
              </ul>
            </div>
            <Button
              onClick={() => {
                setShowChatbot(true);
                setChatbotMinimized(false);
              }}
              variant="default"
              size="sm"
              className="shrink-0"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Open Chat
            </Button>
          </div>
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

      {showVoiceTeacher && (
        <VoiceTeacher
          videoData={videoData}
          onClose={() => setShowVoiceTeacher(false)}
        />
      )}

      {showChatbot && (
        <RegionalChatbot
          videoData={videoData}
          isMinimized={chatbotMinimized}
          onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
        />
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
