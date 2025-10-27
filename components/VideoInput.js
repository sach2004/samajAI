"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Globe, MapPin, Sparkles, Mic2, Languages } from "lucide-react";

const SUPPORTED_LANGUAGES = [
  { value: "hi", label: "Hindi (हिंदी)" },
  { value: "ta", label: "Tamil (தமிழ்)" },
  { value: "te", label: "Telugu (తెలుగు)" },
  { value: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { value: "ml", label: "Malayalam (മലയാളം)" },
  { value: "bn", label: "Bengali (বাংলা)" },
  { value: "mr", label: "Marathi (मराठी)" },
  { value: "gu", label: "Gujarati (ગુજરાતી)" },
];

const REGIONS = [
  { value: "urban-delhi", label: "Urban Delhi" },
  { value: "urban-mumbai", label: "Urban Mumbai" },
  { value: "urban-bangalore", label: "Urban Bangalore" },
  { value: "urban-chennai", label: "Urban Chennai" },
  { value: "urban-kolkata", label: "Urban Kolkata" },
  { value: "urban-hyderabad", label: "Urban Hyderabad" },
  { value: "rural-punjab", label: "Rural Punjab" },
  { value: "rural-up", label: "Rural Uttar Pradesh" },
  { value: "rural-bihar", label: "Rural Bihar" },
  { value: "rural-maharashtra", label: "Rural Maharashtra" },
];

const VOICE_OPTIONS = [
  { value: "male", label: "Male Voice" },
  { value: "female", label: "Female Voice" },
];

const WEBSITE_TRANSLATIONS = {
  en: {
    transformTitle: "Transform Educational Videos",
    transformDesc: "Convert English educational content into culturally relevant Indian language versions",
    urlLabel: "YouTube Video URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "Enter any educational YouTube video with English captions",
    targetLangLabel: "Target Language",
    regionLabel: "Regional Context",
    regionHint: "Adapt examples and references to this region",
    voiceLabel: "Voice Gender",
    websiteLangLabel: "Website Language",
    submitButton: "🚀 Contextualize Video",
    exampleTitle: "Example Transformation:",
  },
  hi: {
    transformTitle: "शैक्षिक वीडियो को बदलें",
    transformDesc: "अंग्रेजी शैक्षिक सामग्री को सांस्कृतिक रूप से प्रासंगिक भारतीय भाषा संस्करणों में बदलें",
    urlLabel: "YouTube वीडियो URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "अंग्रेजी कैप्शन वाला कोई भी शैक्षिक YouTube वीडियो दर्ज करें",
    targetLangLabel: "लक्ष्य भाषा",
    regionLabel: "क्षेत्रीय संदर्भ",
    regionHint: "इस क्षेत्र के उदाहरण अपनाएं",
    voiceLabel: "आवाज़ का लिंग",
    websiteLangLabel: "वेबसाइट भाषा",
    submitButton: "🚀 वीडियो को बदलें",
    exampleTitle: "उदाहरण परिवर्तन:",
  },
};

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

    if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
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
    <div className="max-w-3xl mx-auto mt-12">
      <Card className="p-8 shadow-xl border-2">
        {/* Website Language Selector */}
        <div className="flex justify-end mb-4">
          <Select value={websiteLang} onValueChange={setWebsiteLang}>
            <SelectTrigger className="w-fit">
              <Languages className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.transformTitle}
          </h2>
          <p className="text-gray-600">
            {t.transformDesc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t.urlLabel}
            </label>
            <Input
              type="text"
              placeholder={t.urlPlaceholder}
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="text-lg"
            />
            <p className="text-xs text-gray-500">
              {t.urlHint}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t.targetLangLabel}
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
              {t.regionLabel}
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
              {t.regionHint}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mic2 className="w-4 h-4" />
              {t.voiceLabel}
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
            <p className="text-xs text-gray-500">
              Choose voice that matches the video narrator
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full text-lg py-6 bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700">
            {t.submitButton}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-sm text-blue-900 mb-2">
            {t.exampleTitle}
          </h3>
          <div className="space-y-1 text-xs text-blue-800">
            <p>🇺🇸 Original: "Buy 5 apples at $2 each from the store..."</p>
            <p>🇮🇳 Hindi: "5 आम ₹40 प्रति किलो सब्जी मंडी से खरीदें..."</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
