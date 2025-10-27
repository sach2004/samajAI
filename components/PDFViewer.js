"use client";

import { Download } from "lucide-react";
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
    const blob = new Blob(
      [Uint8Array.from(atob(pdfData.pdfBase64), (c) => c.charCodeAt(0))],
      { type: "application/pdf" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfData.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold mb-2">PDF Ready! 🎉</h3>
            <Badge variant="secondary">
              {LANGUAGE_NAMES[pdfData.language]}
            </Badge>
          </div>
          <Button
            onClick={handleDownload}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <iframe
          src={`data:application/pdf;base64,${pdfData.pdfBase64}`}
          className="w-full h-[700px] border rounded"
          title="PDF Preview"
        />
      </Card>

      {pdfData.changes.examples && pdfData.changes.examples.length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-lg mb-4">Cultural Adaptations:</h3>
          <ul className="space-y-2">
            {pdfData.changes.examples.map((ex, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
