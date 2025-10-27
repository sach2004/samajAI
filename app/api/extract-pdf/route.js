import { NextResponse } from "next/server";
import * as pdfParse from "pdf-parse";

export async function POST(request) {
  try {
    const { pdfBase64, fileName } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF data" }, { status: 400 });
    }

    console.log("📄 Extracting from:", fileName);

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Use the default export correctly
    const parse = pdfParse.default || pdfParse;
    const data = await parse(pdfBuffer);

    const text = data.text.trim();

    if (!text) {
      return NextResponse.json({ error: "No text in PDF" }, { status: 400 });
    }

    console.log(
      "✅ Extracted:",
      text.length,
      "chars from",
      data.numpages,
      "pages"
    );

    return NextResponse.json({
      text,
      metadata: { pages: data.numpages, fileName, textLength: text.length },
    });
  } catch (error) {
    console.error("💥 Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
