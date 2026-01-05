import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { LANGUAGE_NAMES } from "../../../lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { text, targetLanguage, region } = await request.json();
    const languageName = LANGUAGE_NAMES[targetLanguage];

    console.log(`🤖 Contextualizing ${text.length} chars to ${languageName}`);

    const prompt = `Translate this English educational content to ${languageName} for ${region} students. Adapt cultural examples:
- Currency: dollar to rupees
- Locations: Store to Sabzi mandi, Mall to Shopping complex, Restaurant to Dhaba
- Food: Hamburger to Samosa, Pizza to Dosa, Apple to Mango
- Names: John to Rahul, Sarah to Priya, Michael to Arjun
- Measurements: Fahrenheit to Celsius, miles to km, feet to meters

Keep educational concepts identical, only change examples.

TEXT:
${text}

Return ONLY the translated text in ${languageName}.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    });

    const result = await model.generateContent(prompt);
    const contextualizedText = result.response.text();

    console.log("✅ Contextualized:", contextualizedText.length, "chars");

    const changes = {
      currencyConversions: (text.match(/\$|dollar/gi) || []).length,
      locationChanges: (text.match(/store|mall|restaurant/gi) || []).length,
      measurementConversions: (text.match(/fahrenheit|mile|feet|pound/gi) || [])
        .length,
      culturalAdaptations: 0,
      examples: [],
    };

    changes.culturalAdaptations =
      changes.currencyConversions +
      changes.locationChanges +
      changes.measurementConversions;

    if (changes.currencyConversions > 0)
      changes.examples.push(
        `${changes.currencyConversions} currency conversions to ₹`
      );
    if (changes.locationChanges > 0)
      changes.examples.push(`${changes.locationChanges} locations adapted`);
    if (changes.measurementConversions > 0)
      changes.examples.push(
        `${changes.measurementConversions} measurements converted`
      );

    return NextResponse.json({ contextualizedText, changes });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
