"use client";

import { FileText, Globe, Languages, Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [websiteLang, setWebsiteLang] = useState("en");
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);

  const t = WEBSITE_TRANSLATIONS[websiteLang];

  useEffect(() => {
    // Load PDF.js from CDN
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfjsLoaded(true);
      console.log("✅ PDF.js loaded");
    };
    document.body.appendChild(script);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        setPdfFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("PDF must be less than 10MB");
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

    if (!pdfjsLoaded) {
      setError("PDF.js is still loading, please wait...");
      return;
    }

    setExtracting(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();

      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      console.log("📄 PDF loaded:", pdf.numPages, "pages");

      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n\n";

        console.log(`📄 Extracted page ${i}/${pdf.numPages}`);
      }

      const text = fullText.trim();

      if (!text) {
        setError("No text found in PDF. This might be an image-based PDF.");
        setExtracting(false);
        return;
      }

      console.log(
        "✅ Extracted:",
        text.length,
        "characters from",
        pdf.numPages,
        "pages"
      );

      sessionStorage.setItem("pdfText", text);
      sessionStorage.setItem("pdfFileName", pdfFile.name);
      sessionStorage.setItem("pdfPages", pdf.numPages.toString());
      sessionStorage.setItem("targetLanguage", language);
      sessionStorage.setItem("region", "urban-delhi");

      onStartProcessing();
    } catch (err) {
      console.error("PDF extraction error:", err);
      setError("Failed to extract PDF: " + err.message);
      setExtracting(false);
    }
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
            </SelectContent>
          </Select>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Transform Educational PDFs
          </h2>
          <p className="text-gray-600">
            Upload English PDF → Get Contextualized PDF in Indian Languages
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Upload PDF Document
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
                disabled={extracting || !pdfjsLoaded}
              />
              <label
                htmlFor="pdf-upload"
                className={`cursor-pointer flex flex-col items-center ${
                  extracting ? "opacity-50" : ""
                }`}
              >
                {extracting ? (
                  <Loader2 className="w-12 h-12 text-purple-600 mb-3 animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                )}
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
                      {!pdfjsLoaded
                        ? "Loading PDF library..."
                        : extracting
                        ? "Extracting text..."
                        : "Click to upload PDF"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max 10MB • Text-based PDFs only
                    </p>
                  </div>
                )}
              </label>
            </div>
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!pdfFile || extracting || !pdfjsLoaded}
          >
            {extracting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Extracting PDF...
              </>
            ) : (
              "🚀 Contextualize PDF"
            )}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-sm text-purple-900 mb-2">
            How It Works:
          </h3>
          <div className="space-y-1 text-xs text-purple-800">
            <p>✓ Extract text from PDF (in your browser - 100% client-side)</p>
            <p>
              ✓ AI translates to{" "}
              {SUPPORTED_LANGUAGES.find((l) => l.value === language)?.label}
            </p>
            <p>✓ Adapt cultural examples ($ → ₹, Store → Sabzi mandi)</p>
            <p>✓ Generate new PDF with contextualized content</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
