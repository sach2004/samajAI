const { GoogleGenerativeAI } = require("@google/generative-ai");
const https = require('https');

console.log("🔍 COMPREHENSIVE DEBUG SCRIPT\n");
console.log("=" .repeat(60));

// Step 1: Check environment variables
console.log("\n📋 STEP 1: Checking Environment Variables");
console.log("=" .repeat(60));

const apiKey = process.env.GEMINI_API_KEY;
console.log("GEMINI_API_KEY exists:", !!apiKey);
console.log("GEMINI_API_KEY length:", apiKey ? apiKey.length : 0);
console.log("GEMINI_API_KEY starts with 'AIzaSy':", apiKey ? apiKey.startsWith('AIzaSy') : false);
console.log("GEMINI_API_KEY (first 20 chars):", apiKey ? apiKey.substring(0, 20) + "..." : "NOT SET");

if (!apiKey) {
  console.log("\n❌ ERROR: GEMINI_API_KEY not found in environment!");
  console.log("💡 TIP: Make sure you're loading .env.local correctly");
  process.exit(1);
}

// Step 2: Test API key with direct HTTP request
console.log("\n\n🌐 STEP 2: Testing API Key with Direct HTTP Request");
console.log("=" .repeat(60));

function testAPIKeyDirectly(model) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const data = JSON.stringify({
      contents: [{
        parts: [{ text: "Hi" }]
      }]
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log(`\nTesting: ${model}`);
    console.log(`URL: https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);

    const req = https.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Status Message: ${res.statusMessage}`);
        
        if (res.statusCode === 200) {
          console.log("✅ SUCCESS! Model works!");
          try {
            const parsed = JSON.parse(responseData);
            console.log("Response:", parsed.candidates?.[0]?.content?.parts?.[0]?.text || "No text");
          } catch (e) {
            console.log("Raw response:", responseData.substring(0, 200));
          }
          resolve(model);
        } else if (res.statusCode === 404) {
          console.log("❌ 404 NOT FOUND - Model doesn't exist or API key lacks access");
          console.log("Response:", responseData.substring(0, 500));
          resolve(null);
        } else if (res.statusCode === 429) {
          console.log("⚠️  429 QUOTA EXCEEDED - But model exists!");
          resolve(model);
        } else if (res.statusCode === 403) {
          console.log("❌ 403 FORBIDDEN - API key is invalid or restricted");
          console.log("Response:", responseData);
          resolve(null);
        } else if (res.statusCode === 400) {
          console.log("⚠️  400 BAD REQUEST - But model might exist");
          console.log("Response:", responseData.substring(0, 500));
          resolve(null);
        } else {
          console.log(`❌ Unexpected status: ${res.statusCode}`);
          console.log("Response:", responseData.substring(0, 500));
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log("❌ Network Error:", error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Step 3: List available models using API
console.log("\n\n📋 STEP 3: Listing Available Models from API");
console.log("=" .repeat(60));

function listAvailableModels() {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    console.log("\nFetching model list...");

    https.get(url, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(responseData);
            console.log("\n✅ Successfully retrieved model list!");
            console.log(`\nTotal models available: ${parsed.models?.length || 0}\n`);
            
            if (parsed.models && parsed.models.length > 0) {
              console.log("Available models that support generateContent:");
              parsed.models.forEach(model => {
                const supportsGenerate = model.supportedGenerationMethods?.includes('generateContent');
                if (supportsGenerate) {
                  const modelName = model.name.replace('models/', '');
                  console.log(`  ✅ ${modelName}`);
                }
              });
            } else {
              console.log("❌ No models found! Your API key might not have access.");
            }
            resolve(parsed.models || []);
          } catch (e) {
            console.log("❌ Failed to parse response:", e.message);
            console.log("Raw response:", responseData.substring(0, 500));
            resolve([]);
          }
        } else if (res.statusCode === 403) {
          console.log("❌ 403 FORBIDDEN - API key is invalid or lacks permissions");
          console.log("Response:", responseData);
          resolve([]);
        } else {
          console.log(`❌ Unexpected status: ${res.statusCode}`);
          console.log("Response:", responseData.substring(0, 500));
          resolve([]);
        }
      });
    }).on('error', (error) => {
      console.log("❌ Network Error:", error.message);
      reject(error);
    });
  });
}

// Step 4: Test with SDK
console.log("\n\n🧪 STEP 4: Testing with Google Generative AI SDK");
console.log("=" .repeat(60));

async function testWithSDK() {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTry = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-pro",
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`\nTesting SDK with: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hi");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} WORKS! Response: ${text}`);
      return modelName;
    } catch (error) {
      if (error.message.includes("404")) {
        console.log(`❌ ${modelName} - 404 Not Found`);
      } else if (error.message.includes("429")) {
        console.log(`⚠️  ${modelName} - Quota Exceeded (but exists)`);
        return modelName;
      } else if (error.message.includes("403")) {
        console.log(`❌ ${modelName} - 403 Forbidden`);
      } else {
        console.log(`❌ ${modelName} - Error: ${error.message.substring(0, 100)}`);
      }
    }
  }
  return null;
}

// Run all tests
async function runAllTests() {
  try {
    // Test 1: List models
    const models = await listAvailableModels();
    
    // Test 2: Try direct HTTP requests
    console.log("\n\n🔧 STEP 5: Testing Models with Direct HTTP Requests");
    console.log("=" .repeat(60));
    
    const testModels = [
      "gemini-2.0-flash-exp",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro",
    ];
    
    for (const model of testModels) {
      await testAPIKeyDirectly(model);
    }
    
    // Test 3: SDK test
    const workingModel = await testWithSDK();
    
    // Final summary
    console.log("\n\n" + "=" .repeat(60));
    console.log("📊 FINAL DIAGNOSIS");
    console.log("=" .repeat(60));
    
    if (models.length === 0) {
      console.log("\n❌ PROBLEM: API key cannot list models");
      console.log("\n🔍 POSSIBLE CAUSES:");
      console.log("  1. API key is invalid/expired");
      console.log("  2. API key is for wrong service (TTS instead of Gemini)");
      console.log("  3. Generative Language API not enabled in Google Cloud");
      console.log("\n💡 SOLUTION:");
      console.log("  → Go to: https://aistudio.google.com/app/apikey");
      console.log("  → Create NEW API key");
      console.log("  → Update .env.local with new key");
    } else if (!workingModel) {
      console.log("\n❌ PROBLEM: API key is valid but no models work");
      console.log("\n🔍 POSSIBLE CAUSES:");
      console.log("  1. Region restrictions");
      console.log("  2. Account limitations");
      console.log("  3. API quota exhausted");
      console.log("\n💡 SOLUTION:");
      console.log("  → Try creating API key from different Google account");
      console.log("  → Check usage at: https://ai.dev/usage");
    } else {
      console.log(`\n✅ SUCCESS! Working model found: ${workingModel}`);
      console.log("\n💡 UPDATE YOUR CODE:");
      console.log(`  model: "${workingModel}"`);
    }
    
  } catch (error) {
    console.log("\n❌ FATAL ERROR:", error.message);
    console.log(error.stack);
  }
}

runAllTests();
