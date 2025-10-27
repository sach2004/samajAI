"use client";

import { Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const LANGUAGE_NAMES = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
  kn: "Kannada",
  ml: "Malayalam",
  gu: "Gujarati",
};

export default function VoiceTeacher({ videoData, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = getLanguageCode(videoData.language);

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          handleUserSpeech(finalTranscript.trim());
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError("Could not understand. Please speak clearly.");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize Audio Context for playback
    try {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      console.error("Audio context error:", e);
    }

    // Welcome message - ONLY ADD ONCE
    const welcomeMsg = getWelcomeMessage(videoData.language);
    setConversation([
      { role: "teacher", content: welcomeMsg, timestamp: Date.now() },
    ]);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudio();
    };
  }, []);

  const getLanguageCode = (lang) => {
    const codes = {
      hi: "hi-IN",
      ta: "ta-IN",
      te: "te-IN",
      bn: "bn-IN",
      mr: "mr-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      gu: "gu-IN",
    };
    return codes[lang] || "hi-IN";
  };

  const getWelcomeMessage = (lang) => {
    const messages = {
      hi: "नमस्ते! मैं आपका AI शिक्षक हूं। आप मुझसे वीडियो के बारे में कोई भी सवाल पूछ सकते हैं। बोलिए!",
      ta: "வணக்கம்! நான் உங்கள் AI ஆசிரியர். வீடியோவைப் பற்றி என்னிடம் கேள்வி கேளுங்கள்!",
      te: "నమస్కారం! నేను మీ AI టీచర్‌ని. వీడియో గురించి నన్ను ఏదైనా అడగండి!",
      bn: "নমস্কার! আমি আপনার AI শিক্ষক। ভিডিও সম্পর্কে আমাকে যেকোনো প্রশ্ন করুন!",
      mr: "नमस्कार! मी तुमचा AI शिक्षक आहे. व्हिडिओबद्दल मला काहीही विचारा!",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಶಿಕ್ಷಕ. ವೀಡಿಯೊ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಿ!",
      ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI അദ്ധ്യാപകൻ. വീഡിയോയെക്കുറിച്ച് എന്നോട് ചോദിക്കൂ!",
      gu: "નમસ્તે! હું તમારો AI શિક્ષક છું. વિડિઓ વિશે મને પૂછો!",
    };
    return messages[lang] || messages.hi;
  };

  const addMessage = (role, content, audioBase64 = null) => {
    setConversation((prev) => [
      ...prev,
      { role, content, audioBase64, timestamp: Date.now() },
    ]);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError("");
      setTranscript("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleUserSpeech = async (text) => {
    setIsListening(false);
    addMessage("student", text);
    setIsProcessing(true);
    setError("");

    try {
      // Call AI Teacher API
      const response = await fetch("/api/voice-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          language: videoData.language,
          videoContext: {
            transcript: videoData.contextualizedTranscript,
            changes: videoData.changes,
          },
          conversationHistory: conversation.slice(-6), // Last 3 exchanges
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      addMessage("teacher", data.answer, data.audioBase64);

      // Auto-play response
      if (data.audioBase64) {
        await playAudio(data.audioBase64);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Sorry, I could not process your question. Please try again.");
    } finally {
      setIsProcessing(false);
      setTranscript("");
    }
  };

  const playAudio = async (base64Audio) => {
    if (!audioContextRef.current) return;

    stopAudio();
    setIsSpeaking(true);

    try {
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(
        arrayBuffer
      );
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      audioSourceRef.current = source;
      source.start(0);

      source.onended = () => {
        setIsSpeaking(false);
        audioSourceRef.current = null;
      };
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsSpeaking(false);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const replayMessage = (message) => {
    if (message.audioBase64) {
      playAudio(message.audioBase64);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b-3 border-black flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
              🎙️ AI Teacher - {LANGUAGE_NAMES[videoData.language]}
            </h2>
            <p className="text-sm text-muted-foreground font-bold mt-1">
              Ask me anything about the video!
            </p>
          </div>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                msg.role === "student" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "student"
                    ? "bg-[#f582ae] text-white border-3 border-black shadow-cartoon-sm"
                    : "bg-white border-3 border-black shadow-cartoon-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Badge
                    variant={msg.role === "student" ? "outline" : "secondary"}
                  >
                    {msg.role === "student" ? "🎓 You" : "👨‍🏫 Teacher"}
                  </Badge>
                  {msg.audioBase64 && (
                    <Button
                      onClick={() => replayMessage(msg)}
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm leading-relaxed font-bold whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-cartoon-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-bold">
                    Teacher is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t-3 border-black bg-gradient-to-r from-orange-50 to-green-50">
          {transcript && (
            <div className="mb-4 p-3 bg-white rounded-lg border-2 border-black">
              <p className="text-sm font-bold text-gray-700">
                🎤 Listening: {transcript}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border-2 border-red-300">
              <p className="text-sm font-bold text-red-700">⚠️ {error}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleListening}
              disabled={isProcessing || isSpeaking}
              variant={isListening ? "destructive" : "default"}
              size="lg"
              className="gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  {conversation.length > 1
                    ? "Ask Another Question"
                    : "Start Speaking"}
                </>
              )}
            </Button>

            {isSpeaking && (
              <Badge variant="secondary" className="animate-pulse">
                <Volume2 className="w-4 h-4 mr-1" />
                Teacher Speaking...
              </Badge>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground font-bold mt-4">
            💡 Speak clearly in {LANGUAGE_NAMES[videoData.language]} •
            Hands-free learning
          </p>
        </div>
      </Card>
    </div>
  );
}
