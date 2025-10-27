"use client";

import { FileText, Globe, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { SUPPORTED_LANGUAGES } from "../lib/constants";
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
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfjsLoaded(true);
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

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      const text = fullText.trim();

      if (!text) {
        setError("No text found in PDF");
        setExtracting(false);
        return;
      }

      sessionStorage.setItem("pdfText", text);
      sessionStorage.setItem("pdfFileName", pdfFile.name);
      sessionStorage.setItem("pdfPages", pdf.numPages.toString());
      sessionStorage.setItem("targetLanguage", language);
      sessionStorage.setItem("region", "urban-delhi");

      onStartProcessing();
    } catch (err) {
      setError("Failed to extract PDF: " + err.message);
      setExtracting(false);
    }
  };

  return (
    <div>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Upload PDF Document
            </label>

            <div className="border-3 border-dashed border-black rounded-xl p-8 text-center bg-white hover:bg-[#f3d2c1] transition-colors cursor-pointer">
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
                <Upload className="w-12 h-12 text-[#f582ae] mb-3" />
                {pdfFile ? (
                  <div>
                    <p className="text-sm font-bold text-green-600">
                      ✓ {pdfFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-bold">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {!pdfjsLoaded
                        ? "Loading..."
                        : extracting
                        ? "Extracting..."
                        : "Click to upload PDF"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-bold">
                      Max 10MB • Text-based PDFs only
                    </p>
                  </div>
                )}
              </label>
            </div>
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            variant="secondary"
            disabled={!pdfFile || extracting || !pdfjsLoaded}
          >
            {extracting ? "Processing..." : "🚀 Process PDF"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-[#f3d2c1] border-3 border-black rounded-xl">
          <h3 className="font-black text-sm text-foreground mb-2">
            What We Do:
          </h3>
          <div className="space-y-1 text-xs text-muted-foreground font-bold">
            <p>✓ Extract text from your PDF</p>
            <p>✓ Translate to your chosen language</p>
            <p>✓ Adapt cultural examples</p>
            <p>✓ Generate downloadable document</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
