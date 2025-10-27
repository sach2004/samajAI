"use client";

import { FileText, Video } from "lucide-react";
import { useState } from "react";
import PDFInput from "../components/PDFInput";
import PDFProcessingView from "../components/PDFProcessingView";
import PDFViewer from "../components/PDFViewer";
import ProcessingView from "../components/ProcessingView";
import VideoInput from "../components/VideoInput";
import VideoPlayerView from "../components/VideoPlayerView";

export default function Home() {
  const [activeTab, setActiveTab] = useState("video");
  const [step, setStep] = useState("input");
  const [videoData, setVideoData] = useState(null);
  const [pdfData, setPdfData] = useState(null);

  const handleReset = () => {
    setStep("input");
    setVideoData(null);
    setPdfData(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    handleReset();
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
                ← New {activeTab === "video" ? "Video" : "PDF"}
              </button>
            )}
          </div>

          {step === "input" && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleTabChange("video")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === "video"
                    ? "bg-gradient-to-r from-orange-600 to-green-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-50 border"
                }`}
              >
                <Video className="w-5 h-5" />
                Video Localization
              </button>
              <button
                onClick={() => handleTabChange("pdf")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === "pdf"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-50 border"
                }`}
              >
                <FileText className="w-5 h-5" />
                PDF Localization
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {activeTab === "video" && (
          <>
            {step === "input" && (
              <VideoInput onStartProcessing={() => setStep("processing")} />
            )}
            {step === "processing" && (
              <ProcessingView
                onComplete={(data) => {
                  setVideoData(data);
                  setStep("player");
                }}
              />
            )}
            {step === "player" && videoData && (
              <VideoPlayerView videoData={videoData} />
            )}
          </>
        )}

        {activeTab === "pdf" && (
          <>
            {step === "input" && (
              <PDFInput onStartProcessing={() => setStep("processing")} />
            )}
            {step === "processing" && (
              <PDFProcessingView
                onComplete={(data) => {
                  setPdfData(data);
                  setStep("viewer");
                }}
              />
            )}
            {step === "viewer" && pdfData && <PDFViewer pdfData={pdfData} />}
          </>
        )}
      </div>
    </main>
  );
}
