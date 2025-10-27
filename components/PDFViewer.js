"use client";

import { Download, FileText } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const LANGUAGE_NAMES = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
};

export default function PDFViewer({ pdfData }) {
  const handleDownload = () => {
    const blob = base64ToBlob(pdfData.pdfBase64, "application/pdf");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfData.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const base64ToBlob = (base64, type) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  };

  const pdfUrl = `data:application/pdf;base64,${pdfData.pdfBase64}`;

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              PDF Ready! 🎉
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {LANGUAGE_NAMES[pdfData.language]}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                ✅ Generated
              </Badge>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {pdfData.changes.currencyConversions}
              </div>
              <div className="text-gray-600">Currency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {pdfData.changes.locationChanges}
              </div>
              <div className="text-gray-600">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {pdfData.changes.measurementConversions}
              </div>
              <div className="text-gray-600">Measurements</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Preview
          </h3>
          <Button
            onClick={handleDownload}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>
        </div>

        <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100">
          <iframe
            src={pdfUrl}
            className="w-full h-[600px]"
            title="PDF Preview"
          />
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>📄 Contextualized PDF:</strong> Translated to{" "}
            {LANGUAGE_NAMES[pdfData.language]}
            with cultural adaptations.
          </p>
        </div>
      </Card>

      {pdfData.changes.examples && pdfData.changes.examples.length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-lg mb-4">
            Cultural Adaptations Made:
          </h3>
          <ul className="space-y-2">
            {pdfData.changes.examples.map((example, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
