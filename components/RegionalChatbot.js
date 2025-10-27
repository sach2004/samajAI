"use client";

import { ChevronDown, Loader2, MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

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

const COMMON_QUESTIONS = {
  hi: [
    "मुख्य concept क्या है?",
    "यह example समझाइए",
    "इसका application कहाँ होता है?",
    "और examples दीजिए",
  ],
  ta: [
    "முக்கிய கருத்து என்ன?",
    "இந்த உதாரணத்தை விளக்கவும்",
    "இதன் பயன்பாடு என்ன?",
    "மேலும் உதாரணங்கள்",
  ],
  te: [
    "ప్రధాన concept ఏమిటి?",
    "ఈ example వివరించండి",
    "దీని application ఏమిటి?",
    "మరిన్ని examples",
  ],
  bn: [
    "মূল concept কি?",
    "এই example বুঝিয়ে দিন",
    "এর application কোথায়?",
    "আরও examples",
  ],
  mr: [
    "मुख्य concept काय आहे?",
    "हे example समजावून सांगा",
    "याचा application कुठे आहे?",
    "आणखी examples द्या",
  ],
  kn: [
    "ಮುಖ್ಯ concept ಏನು?",
    "ಈ example ವಿವರಿಸಿ",
    "ಇದರ application ಎಲ್ಲಿ?",
    "ಹೆಚ್ಚು examples",
  ],
  ml: [
    "പ്രധാന concept എന്താണ്?",
    "ഈ example വിശദീകരിക്കൂ",
    "ഇതിന്റെ application എവിടെ?",
    "കൂടുതൽ examples",
  ],
  gu: [
    "મુખ્ય concept શું છે?",
    "આ example સમજાવો",
    "તેનો application ક્યાં છે?",
    "વધુ examples આપો",
  ],
};

export default function RegionalChatbot({
  videoData,
  isMinimized,
  onToggleMinimize,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const welcomeMsg = getWelcomeMessage(videoData.language);
    setMessages([{ role: "bot", content: welcomeMsg, timestamp: Date.now() }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getWelcomeMessage = (lang) => {
    const messages = {
      hi: "नमस्ते! 👋 मैं आपका AI assistant हूं। वीडियो के बारे में कोई भी सवाल पूछें!",
      ta: "வணக்கம்! 👋 நான் உங்கள் AI உதவியாளர். வீடியோவைப் பற்றி கேள்வி கேளுங்கள்!",
      te: "నమస్కారం! 👋 నేను మీ AI సహాయకుడిని. వీడియో గురించి అడగండి!",
      bn: "নমস্কার! 👋 আমি আপনার AI সহায়ক। ভিডিও সম্পর্কে প্রশ্ন করুন!",
      mr: "नमस्कार! 👋 मी तुमचा AI सहाय्यक आहे. व्हिडिओबद्दल विचारा!",
      kn: "ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ AI ಸಹಾಯಕ. ವೀಡಿಯೊ ಬಗ್ಗೆ ಕೇಳಿ!",
      ml: "നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ AI സഹായി. വീഡിയോയെക്കുറിച്ച് ചോദിക്കൂ!",
      gu: "નમસ્તે! 👋 હું તમારો AI સહાયક છું. વિડિઓ વિશે પૂછો!",
    };
    return messages[lang] || messages.hi;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (text = input.trim()) => {
    if (!text || isTyping) return;

    const userMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      const response = await fetch("/api/text-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          language: videoData.language,
          videoContext: {
            transcript: videoData.contextualizedTranscript,
            changes: videoData.changes,
          },
          conversationHistory: messages.slice(-8),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const botMessage = {
        role: "bot",
        content: data.answer,
        timestamp: Date.now(),
        relatedQuestions: data.relatedQuestions,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMsg = {
        role: "bot",
        content:
          "क्षमा करें, मुझे आपके सवाल का जवाब नहीं मिल पाया। कृपया फिर से प्रयास करें।",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={onToggleMinimize}
          size="lg"
          className="rounded-full shadow-cartoon gap-2 px-6"
        >
          <MessageCircle className="w-5 h-5" />
          Ask Questions
          {messages.length > 1 && (
            <Badge variant="destructive" className="ml-1">
              {messages.length - 1}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-md z-40">
      <Card className="flex flex-col h-[600px] shadow-cartoon">
        <div className="p-4 border-b-3 border-black flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#f582ae] rounded-full border-3 border-black flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-foreground">AI Assistant</h3>
              <p className="text-xs text-muted-foreground font-bold">
                {LANGUAGE_NAMES[videoData.language]}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onToggleMinimize} variant="ghost" size="icon-sm">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fef6e4]">
          {messages.map((msg, idx) => (
            <div key={idx}>
              <div
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    msg.role === "user"
                      ? "bg-[#f582ae] text-white border-3 border-black shadow-cartoon-sm"
                      : "bg-white border-3 border-black shadow-cartoon-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed font-bold whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  {msg.role === "bot" && (
                    <button
                      onClick={() => copyToClipboard(msg.content)}
                      className="text-xs text-muted-foreground hover:text-foreground mt-2 font-bold"
                    >
                      📋 Copy
                    </button>
                  )}
                </div>
              </div>

              {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                <div className="mt-2 ml-2 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground mb-1">
                    💡 Students also asked:
                  </p>
                  {msg.relatedQuestions.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => sendMessage(q)}
                      className="block w-full text-left text-xs font-bold text-[#f582ae] hover:text-[#ff69b4] bg-white border-2 border-black rounded-lg p-2 hover:shadow-cartoon-sm transition-all"
                    >
                      → {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border-3 border-black rounded-2xl p-3 shadow-cartoon-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#f582ae]" />
                  <span className="text-sm font-bold">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showSuggestions && messages.length <= 1 && (
          <div className="px-4 pb-2 space-y-2">
            <p className="text-xs font-bold text-muted-foreground">
              🔥 Quick questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                COMMON_QUESTIONS[videoData.language] || COMMON_QUESTIONS.hi
              ).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q)}
                  className="text-xs font-bold px-3 py-1.5 bg-[#8bd3dd] text-foreground rounded-full border-2 border-black hover:shadow-cartoon-sm transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t-3 border-black bg-white">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type in ${LANGUAGE_NAMES[videoData.language]}...`}
              disabled={isTyping}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground font-bold mt-2">
            💬 Type your question • Press Enter to send
          </p>
        </div>
      </Card>
    </div>
  );
}
