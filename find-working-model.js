const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCUv-rxzUJW8uRQz67Jh_EHaGIVQgOh-w4";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
  const modelsToTry = [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-latest",
    "gemini-pro",
    "gemini-1.5-pro-002",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
  ];

  console.log("🧪 Testing available models...\n");

  for (const modelName of modelsToTry) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hi in one word");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} WORKS! Response: ${text}\n`);
    } catch (error) {
      if (error.message.includes("404")) {
        console.log(`❌ ${modelName} - NOT FOUND (404)\n`);
      } else if (error.message.includes("429")) {
        console.log(`⚠️  ${modelName} - QUOTA EXCEEDED (but exists!)\n`);
      } else {
        console.log(`❌ ${modelName} - Error: ${error.message.substring(0, 100)}\n`);
      }
    }
  }
}

testModels();
