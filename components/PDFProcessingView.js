"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

const STEPS = [
  { id: "contextualize", label: "AI translating and contextualizing..." },
  { id: "done", label: "Ready to download!" },
];

export default function PDFProcessingView({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    processPDF();
  }, []);

  const processPDF = async () => {
    try {
      const text = sessionStorage.getItem("pdfText");
      const fileName = sessionStorage.getItem("pdfFileName");
      const language = sessionStorage.getItem("targetLanguage");
      const region = sessionStorage.getItem("region");

      setCurrentStep(0);
      setProgress(30);

      console.log("🔄 Starting contextualization...");

      const contextRes = await fetch("/api/contextualize-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: language, region }),
      });

      if (!contextRes.ok) throw new Error("Failed to contextualize");
      const { contextualizedText, changes } = await contextRes.json();

      console.log("✅ Done!");

      setProgress(100);
      setCurrentStep(1);

      setTimeout(() => {
        onComplete({
          originalText: text,
          contextualizedText,
          fileName: fileName.replace(".pdf", `_${language}.txt`),
          language,
          region,
          changes,
        });
      }, 500);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          Processing Document
        </h2>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <Progress value={progress} className="mb-8" />
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    i < currentStep
                      ? "bg-green-50"
                      : i === currentStep
                      ? "bg-blue-50"
                      : "bg-gray-50"
                  }`}
                >
                  {i < currentStep ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : i === currentStep ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span
                    className={
                      i <= currentStep ? "font-medium" : "text-gray-500"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-900 text-center font-medium">
                ✨ Almost done! You'll be able to save as PDF using your
                browser!
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
