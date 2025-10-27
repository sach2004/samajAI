"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

const PROCESSING_STEPS = [
  { id: "extract", label: "Extracting text from PDF...", duration: 2000 },
  {
    id: "contextualize",
    label: "AI translating and contextualizing...",
    duration: 8000,
  },
  { id: "generate", label: "Generating new PDF...", duration: 3000 },
  { id: "finalize", label: "Finalizing document...", duration: 1000 },
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
      const pdfBase64 = sessionStorage.getItem("pdfBase64") || "";
      const pdfFileName =
        sessionStorage.getItem("pdfFileName") || "document.pdf";
      const targetLanguage = sessionStorage.getItem("targetLanguage") || "hi";
      const region = sessionStorage.getItem("region") || "urban-delhi";

      setCurrentStep(0);

      const extractResponse = await fetch("/api/extract-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, fileName: pdfFileName }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || "Failed to extract PDF");
      }

      const { text, metadata } = await extractResponse.json();

      await simulateProgress(0, 30);
      setCurrentStep(1);

      const contextualizeResponse = await fetch("/api/contextualize-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage, region, metadata }),
      });

      if (!contextualizeResponse.ok) {
        const errorData = await contextualizeResponse.json();
        throw new Error(errorData.error || "Failed to contextualize");
      }

      const { contextualizedText, changes } =
        await contextualizeResponse.json();

      await simulateProgress(30, 60);
      setCurrentStep(2);

      const generateResponse = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: contextualizedText,
          language: targetLanguage,
          originalFileName: pdfFileName,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const { pdfBase64: newPdfBase64 } = await generateResponse.json();

      await simulateProgress(60, 95);
      setCurrentStep(3);
      await simulateProgress(95, 100);

      const pdfData = {
        originalText: text,
        contextualizedText,
        pdfBase64: newPdfBase64,
        fileName: pdfFileName.replace(".pdf", `_${targetLanguage}.pdf`),
        language: targetLanguage,
        region,
        changes,
      };

      setTimeout(() => onComplete(pdfData), 500);
    } catch (err) {
      console.error("PDF Processing error:", err);
      setError(err.message || "An error occurred");
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
            Processing Your PDF
          </h2>
          <p className="text-gray-600">Translating and contextualizing ✨</p>
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
          </>
        )}
      </Card>
    </div>
  );
}
