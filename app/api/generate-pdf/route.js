import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { LANGUAGE_NAMES } from "../../../lib/constants";

export async function POST(request) {
  try {
    const { text, language, originalFileName } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text" }, { status: 400 });
    }

    console.log(`📄 Generating PDF in ${LANGUAGE_NAMES[language]}`);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc
      .fontSize(18)
      .fillColor("#4F46E5")
      .text(`${LANGUAGE_NAMES[language]} Version`, { align: "center" })
      .moveDown(0.3);

    doc
      .fontSize(9)
      .fillColor("#666666")
      .text("Powered by ContextAI 🌏", { align: "center" })
      .moveDown(1.5);

    // Content
    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(text, { align: "justify", lineGap: 4 });

    // Footer
    doc
      .fontSize(8)
      .fillColor("#999999")
      .text(`Original: ${originalFileName}`, 50, doc.page.height - 30, {
        align: "center",
        width: doc.page.width - 100,
      });

    doc.end();

    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const pdfBase64 = pdfBuffer.toString("base64");
    console.log("✅ PDF generated");

    return NextResponse.json({ pdfBase64 });
  } catch (error) {
    console.error("💥 Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
