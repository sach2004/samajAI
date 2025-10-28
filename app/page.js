"use client";

import { FileText, Sparkles, Video } from "lucide-react";
import { useState } from "react";
import PDFInput from "../components/PDFInput";
import PDFProcessingView from "../components/PDFProcessingView";
import PDFViewer from "../components/PDFViewer";
import ProcessingView from "../components/ProcessingView";
import VideoInput from "../components/VideoInput";
import VideoPlayerView from "../components/VideoPlayerView";

export default function Home() {
  const [tab, setTab] = useState("video");
  const [step, setStep] = useState("input");
  const [videoData, setVideoData] = useState(null);
  const [pdfData, setPdfData] = useState(null);

  const reset = () => {
    setStep("input");
    setVideoData(null);
    setPdfData(null);
  };
  const changeTab = (newTab) => {
    setTab(newTab);
    reset();
  };

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <header className="border-b-4 border-black sticky top-0 z-50 bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-foreground">
                Context<span className="text-[#f582ae]">AI</span>
              </h1>
              <p className="text-sm text-muted-foreground font-bold mt-0.5">
                Cultural Localization Platform
              </p>
            </div>
            {step !== "input" && (
              <button
                onClick={reset}
                className="px-5 py-2 text-sm font-bold border-3 border-black rounded-xl bg-white hover:bg-accent transition-colors shadow-cartoon-sm"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </header>

      {step === "input" && (
        <div className="container mx-auto px-6 py-12 max-w-4xl text-center relative">
          <Sparkles className="w-16 h-16 text-[#f582ae] animate-float absolute top-1/4 left-0 transform -translate-x-1/2 -translate-y-1/2" />
          <Sparkles className="w-16 h-16 text-[#8bd3dd] animate-float-slow absolute bottom-1/4 right-0 transform translate-x-1/2 translate-y-1/2" />

          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight">
            Transform Educational Content
            <br />
            Into Your Language
          </h2>

          <p className="text-lg text-muted-foreground font-bold max-w-2xl mx-auto">
            AI-powered platform that translates English educational videos and
            PDFs into culturally-relevant Indian language versions with natural
            voice and localized examples.
          </p>
        </div>
      )}

      <div className="container mx-auto px-6 py-8 flex justify-center relative">
        <div
          className={`w-full ${
            step === "input" ? "max-w-2xl" : "max-w-6xl"
          } relative`}
        >
          {step === "input" && (
            <div
              className="absolute left-1/2 transform -translate-x-1/2 z-10"
              style={{ marginTop: "-65px", marginBottom: "-35px" }}
            >
              <div className="flex gap-2 p-2 rounded-full border-3 border-black shadow-cartoon-sm bg-white">
                <button
                  onClick={() => changeTab("video")}
                  className={`flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold transition-all ${
                    tab === "video"
                      ? "bg-[#f582ae] text-white"
                      : "text-foreground hover:bg-[#f3d2c1]"
                  }`}
                >
                  <Video className="w-5 h-5" />
                  <span>Video</span>
                </button>
                <button
                  onClick={() => changeTab("pdf")}
                  className={`flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold transition-all ${
                    tab === "pdf"
                      ? "bg-[#8bd3dd] text-foreground"
                      : "text-foreground hover:bg-[#f3d2c1]"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-4">
            {tab === "video" && (
              <>
                {step === "input" && (
                  <VideoInput onStartProcessing={() => setStep("processing")} />
                )}
                {step === "processing" && (
                  <ProcessingView
                    onComplete={(d) => {
                      setVideoData(d);
                      setStep("player");
                    }}
                  />
                )}
                {step === "player" && videoData && (
                  <VideoPlayerView videoData={videoData} />
                )}
              </>
            )}
            {tab === "pdf" && (
              <>
                {step === "input" && (
                  <PDFInput onStartProcessing={() => setStep("processing")} />
                )}
                {step === "processing" && (
                  <PDFProcessingView
                    onComplete={(d) => {
                      setPdfData(d);
                      setStep("viewer");
                    }}
                  />
                )}
                {step === "viewer" && pdfData && (
                  <PDFViewer pdfData={pdfData} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t-4 border-black mt-16 py-6 bg-white">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-bold text-muted-foreground">
            Built with Next.js, Tailwind CSS, Google Gemini AI & Cloud
            Text-to-Speech
          </p>
        </div>
      </footer>
    </main>
  );
}
