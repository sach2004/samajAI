"use client";

import { FileText, Globe, Languages, Upload } from "lucide-react";
import { useState } from "react";
import { SUPPORTED_LANGUAGES, WEBSITE_TRANSLATIONS } from "../lib/constants";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function PDFInput({ onStartProcessing }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [language, setLanguage] = useState("hi");
  const [region, setRegion] = useState("urban-delhi");
  const [websiteLang, setWebsiteLang] = useState("en");
  const [error, setError] = useState("");

  const t = WEBSITE_TRANSLATIONS[websiteLang];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        setPdfFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("PDF file must be less than 10MB");
        setPdfFile(null);
        return;
      }
      setPdfFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!pdfFile) {
      setError("Please upload a PDF file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];

      sessionStorage.setItem("pdfBase64", base64);
      sessionStorage.setItem("pdfFileName", pdfFile.name);
      sessionStorage.setItem("targetLanguage", language);
      sessionStorage.setItem("region", region);

      onStartProcessing();
    };
    reader.readAsDataURL(pdfFile);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <Card className="p-8 shadow-xl border-2">
        <div className="flex justify-end mb-4">
          <Select value={websiteLang} onValueChange={setWebsiteLang}>
            <SelectTrigger className="w-fit">
              <Languages className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
              <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
              <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
              <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
              <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
              <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
              <SelectItem value="mr">मराठी (Marathi)</SelectItem>
              <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Transform Educational PDFs
          </h2>
          <p className="text-gray-600">
            Convert English PDFs into culturally relevant Indian language
            versions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Upload PDF
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                {pdfFile ? (
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      ✓ {pdfFile.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload PDF
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
                  </div>
                )}
              </label>
            </div>
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!pdfFile}
          >
            🚀 Contextualize PDF
          </Button>
        </form>

        <div className="mt-8 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-sm text-purple-900 mb-2">
            What We Do:
          </h3>
          <div className="space-y-1 text-xs text-purple-800">
            <p>✓ Extract text from your PDF</p>
            <p>
              ✓ Translate to{" "}
              {SUPPORTED_LANGUAGES.find((l) => l.value === language)?.label}
            </p>
            <p>✓ Adapt cultural examples ($ → ₹, Store → Sabzi mandi)</p>
            <p>✓ Generate new PDF</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
