import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCUv-rxzUJW8uRQz67Jh_EHaGIVQgOh-w4");

async function testModels() {
  const modelsToTry = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-exp-1206",
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`\n🧪 Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello in one word");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} WORKS! Response: ${text}`);
      break; // Stop at first working model
    } catch (error) {
      console.log(`❌ ${modelName} failed: ${error.message}`);
    }
  }
}

testModels();
