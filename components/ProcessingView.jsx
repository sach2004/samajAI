"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const PROCESSING_STEPS = [
  {
    id: "extract",
    label: "Extracting transcript from YouTube...",
    duration: 3000,
  },
  { id: "analyze", label: "Analyzing content...", duration: 2000 },
  {
    id: "contextualize",
    label: "AI contextualizing for target language...",
    duration: 8000,
  },
  { id: "audio", label: "Generating natural voice audio...", duration: 5000 },
  { id: "finalize", label: "Finalizing your video...", duration: 2000 },
];

export default function ProcessingView({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    processVideo();
  }, []);

  const processVideo = async () => {
    try {
      const videoUrl = sessionStorage.getItem("videoUrl") || "";
      const targetLanguage = sessionStorage.getItem("targetLanguage") || "hi";
      const region = sessionStorage.getItem("region") || "urban-delhi";

      setCurrentStep(0);
      const transcriptResponse = await fetch("/api/extract-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        throw new Error(errorData.error || "Failed to extract transcript");
      }

      const { videoId, transcript } = await transcriptResponse.json();

      await simulateProgress(0, 20);
      setCurrentStep(1);

      await simulateProgress(20, 30);
      setCurrentStep(2);

      const contextualizeResponse = await fetch("/api/contextualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          transcript,
          targetLanguage,
          region,
        }),
      });

      if (!contextualizeResponse.ok) {
        const errorData = await contextualizeResponse.json();
        throw new Error(errorData.error || "Failed to contextualize");
      }

      const { contextualizedTranscript, changes } =
        await contextualizeResponse.json();

      await simulateProgress(30, 60);
      setCurrentStep(3);

      const audioResponse = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: contextualizedTranscript,
          language: targetLanguage,
        }),
      });

      if (!audioResponse.ok) {
        const errorData = await audioResponse.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const { audioSegments } = await audioResponse.json();

      await simulateProgress(60, 95);
      setCurrentStep(4);

      await simulateProgress(95, 100);

      const videoData = {
        videoId,
        originalTranscript: transcript,
        contextualizedTranscript,
        audioSegments,
        language: targetLanguage,
        region,
        changes,
      };

      setTimeout(() => onComplete(videoData), 500);
    } catch (err) {
      console.error("Processing error:", err);
      setError(err.message || "An error occurred during processing");
    }
  };

  const simulateProgress = (from, to) => {
    return new Promise((resolve) => {
      const step = (to - from) / 20;
      let current = from;

      const interval = setInterval(() => {
        current += step;
        if (current >= to) {
          setProgress(to);
          clearInterval(interval);
          resolve();
        } else {
          setProgress(current);
        }
      }, 50);
    });
  };

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <Card className="p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Your Video
          </h2>
          <p className="text-gray-600">
            Creating natural voice audio with Indian accent ✨
          </p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <Progress value={progress} className="mb-8" />

            <div className="space-y-4">
              {PROCESSING_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    index < currentStep
                      ? "bg-green-50"
                      : index === currentStep
                      ? "bg-blue-50"
                      : "bg-gray-50"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : index === currentStep ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      index <= currentStep
                        ? "text-gray-900 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-green-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                🎙️ Using Google Cloud&apos;s WaveNet voices for natural Indian
                accent!
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
