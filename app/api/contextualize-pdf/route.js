import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { LANGUAGE_NAMES } from "../../../lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request) {
  try {
    const { text, targetLanguage, region } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text" }, { status: 400 });
    }

    const languageName = LANGUAGE_NAMES[targetLanguage] || "Hindi";
    console.log(`🤖 Contextualizing to ${languageName}`);

    const prompt = `Translate this English educational content to ${languageName} and adapt cultural examples:
- Currency: $ → ₹
- Locations: Store → Sabzi mandi, Restaurant → Dhaba
- Food: Hamburger → Samosa, Pizza → Dosa
- Names: John → Rahul, Sarah → Priya
- Measurements: °F → °C, miles → km

Keep educational concepts same, only change examples.

TEXT:
${text}

Return ONLY the translated text in ${languageName}.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    });

    const result = await model.generateContent(prompt);
    const contextualizedText = result.response.text();

    console.log("✅ Done:", contextualizedText.length, "chars");

    const changes = detectChanges(text);

    return NextResponse.json({ contextualizedText, changes });
  } catch (error) {
    console.error("💥 Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function detectChanges(text) {
  const currencyMatches = (text.match(/\$|dollar|cent/gi) || []).length;
  const locationMatches = (text.match(/store|walmart|mall|restaurant/gi) || [])
    .length;
  const measurementMatches = (
    text.match(/fahrenheit|°f|mile|feet|pound/gi) || []
  ).length;

  return {
    currencyConversions: currencyMatches,
    locationChanges: locationMatches,
    measurementConversions: measurementMatches,
    culturalAdaptations: currencyMatches + locationMatches + measurementMatches,
    examples: [
      currencyMatches > 0 && `${currencyMatches} currency conversions`,
      locationMatches > 0 && `${locationMatches} location adaptations`,
      measurementMatches > 0 && `${measurementMatches} measurement conversions`,
    ].filter(Boolean),
  };
}
