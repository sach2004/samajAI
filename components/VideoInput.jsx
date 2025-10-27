"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGIONS, SUPPORTED_LANGUAGES } from "@/lib/constants";
import { Globe, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";

export default function VideoInput({ onStartProcessing }) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [language, setLanguage] = useState("hi");
  const [region, setRegion] = useState("urban-delhi");
  const [error, setError] = useState("");

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

    onStartProcessing();
  };

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <Card className="p-8 shadow-xl border-2">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Transform Educational Videos
          </h2>
          <p className="text-gray-600">
            Convert English educational content into culturally relevant Indian
            language versions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              YouTube Video URL
            </label>
            <Input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="text-lg"
            />
            <p className="text-xs text-gray-500">
              Enter any educational YouTube video with English captions
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Regional Context
            </label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((reg) => (
                  <SelectItem key={reg.value} value={reg.value}>
                    {reg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Adapt examples and references to this region
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full text-lg py-6 bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700"
          >
            🚀 Contextualize Video
          </Button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-sm text-blue-900 mb-2">
            Example Transformation:
          </h3>
          <div className="space-y-1 text-xs text-blue-800">
            <p>
              🇺🇸 Original: &quot;Buy 5 apples at $2 each from the store...&quot;
            </p>
            <p>
              🇮🇳 Hindi: &quot;5 आम ₹40 प्रति किलो सब्जी मंडी से खरीदें...&quot;
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
