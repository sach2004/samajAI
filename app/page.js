"use client";

import ProcessingView from "@/components/ProcessingView";
import VideoInput from "@/components/VideoInput";
import VideoPlayerView from "@/components/VideoPlayerView";
import { useState } from "react";

export default function Home() {
  const [step, setStep] = useState("input");
  const [videoData, setVideoData] = useState(null);

  const handleStartProcessing = () => {
    setStep("processing");
  };

  const handleProcessingComplete = (data) => {
    setVideoData(data);
    setStep("player");
  };

  const handleReset = () => {
    setStep("input");
    setVideoData(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                ContextAI 🌏
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Make EdTech Feel Like Home
              </p>
            </div>
            {step !== "input" && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← New Video
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {step === "input" && (
          <VideoInput onStartProcessing={handleStartProcessing} />
        )}

        {step === "processing" && (
          <ProcessingView onComplete={handleProcessingComplete} />
        )}

        {step === "player" && videoData && (
          <VideoPlayerView videoData={videoData} />
        )}
      </div>
    </main>
  );
}
