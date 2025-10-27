"use client";

import { Globe, Languages, Mic2, Youtube } from "lucide-react";
import { useState } from "react";
import {
  SUPPORTED_LANGUAGES,
  VOICE_OPTIONS,
  WEBSITE_TRANSLATIONS,
} from "../lib/constants";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function VideoInput({ onStartProcessing }) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [language, setLanguage] = useState("hi");
  const [region, setRegion] = useState("urban-delhi");
  const [voiceGender, setVoiceGender] = useState("female");
  const [websiteLang, setWebsiteLang] = useState("en");
  const [error, setError] = useState("");

  const t = WEBSITE_TRANSLATIONS[websiteLang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (
      !youtubeUrl.includes("youtube.com") &&
      !youtubeUrl.includes("youtu.be")
    ) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    sessionStorage.setItem("videoUrl", youtubeUrl);
    sessionStorage.setItem("targetLanguage", language);
    sessionStorage.setItem("region", region);
    sessionStorage.setItem("voiceGender", voiceGender);

    onStartProcessing();
  };

  return (
    <div>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              <Youtube className="w-4 h-4" />
              YouTube Video URL
            </label>
            <Input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground font-bold">
              Enter any educational YouTube video with English captions
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Target Language
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              <Mic2 className="w-4 h-4" />
              Voice Gender
            </label>
            <Select value={voiceGender} onValueChange={setVoiceGender}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" size="lg" variant="default">
            🚀 Process Video
          </Button>
        </form>

        <div className="mt-6 p-4 bg-[#f3d2c1] border-3 border-black rounded-xl">
          <h3 className="font-black text-sm text-foreground mb-2">
            What We Do:
          </h3>
          <div className="space-y-1 text-xs text-muted-foreground font-bold">
            <p>✓ Extract transcript from YouTube video</p>
            <p>✓ Translate to your chosen language</p>
            <p>✓ Adapt cultural examples ($ → ₹, Pizza → Dosa)</p>
            <p>✓ Generate natural voice audio</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
