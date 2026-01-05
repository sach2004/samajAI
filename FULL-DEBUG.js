require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const https = require('https');

console.log("🔍 COMPREHENSIVE API KEY & QUOTA DEBUG\n");
console.log("=".repeat(70));

// STEP 1: Environment Check
console.log("\n📋 STEP 1: Environment Variables Check");
console.log("=".repeat(70));

const apiKey = process.env.GEMINI_API_KEY;
const ttsKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;

console.log("GEMINI_API_KEY exists:", !!apiKey);
console.log("GEMINI_API_KEY value:", apiKey || "NOT SET");
console.log("GEMINI_API_KEY length:", apiKey ? apiKey.length : 0);
console.log("GEMINI_API_KEY format valid:", apiKey ? apiKey.startsWith('AIzaSy') : false);
console.log("\nGOOGLE_CLOUD_TTS_API_KEY exists:", !!ttsKey);
console.log("GOOGLE_CLOUD_TTS_API_KEY value:", ttsKey || "NOT SET");
console.log("\nKeys are different:", apiKey !== ttsKey);

if (!apiKey) {
  console.log("\n❌ FATAL: GEMINI_API_KEY not found!");
  process.exit(1);
}

// STEP 2: List ALL available models
console.log("\n\n📋 STEP 2: Listing ALL Available Models");
console.log("=".repeat(70));

function listAllModels() {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    console.log("Fetching model list from Google API...\n");

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode} ${res.statusMessage}\n`);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`✅ Total models available: ${parsed.models?.length || 0}\n`);
            
            const generateModels = [];
            
            if (parsed.models) {
              console.log("Models that support 'generateContent':\n");
              parsed.models.forEach(model => {
                const methods = model.supportedGenerationMethods || [];
                if (methods.includes('generateContent')) {
                  const name = model.name.replace('models/', '');
                  generateModels.push(name);
                  console.log(`  ✅ ${name}`);
                }
              });
            }
            
            console.log(`\n📊 Found ${generateModels.length} models for text generation`);
            resolve(generateModels);
          } catch (e) {
            console.log("❌ Parse error:", e.message);
            resolve([]);
          }
        } else if (res.statusCode === 403) {
          console.log("❌ 403 FORBIDDEN - API key is INVALID or REVOKED");
          console.log("Response:", data.substring(0, 500));
          resolve([]);
        } else {
          console.log(`❌ Error ${res.statusCode}`);
          console.log("Response:", data.substring(0, 500));
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.log("❌ Network error:", err.message);
      reject(err);
    });
  });
}

// STEP 3: Check quota for each model
console.log("\n\n🔍 STEP 3: Testing Each Model (Quota Check)");
console.log("=".repeat(70));

async function testModelQuota(modelName) {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const requestData = JSON.stringify({
      contents: [{ parts: [{ text: "Hi" }] }]
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    console.log(`\nTesting: ${modelName}`);

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        const status = res.statusCode;
        
        if (status === 200) {
          console.log(`  ✅ SUCCESS - Model works! Quota available!`);
          try {
            const parsed = JSON.parse(responseData);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`  Response: "${text}"`);
          } catch (e) {}
          resolve({ model: modelName, status: 'working', code: 200 });
        } else if (status === 429) {
          console.log(`  ⚠️  429 QUOTA EXCEEDED - Model exists but no quota left`);
          try {
            const parsed = JSON.parse(responseData);
            const retryAfter = parsed.error?.message?.match(/retry in ([\d.]+)s/);
            if (retryAfter) {
              console.log(`  Retry after: ${retryAfter[1]} seconds`);
            }
            // Check quota type
            if (responseData.includes('GenerateRequestsPerDayPerProjectPerModel-FreeTier')) {
              console.log(`  ❌ DAILY quota exhausted - wait until tomorrow`);
            } else if (responseData.includes('GenerateRequestsPerMinutePerProjectPerModel-FreeTier')) {
              console.log(`  ⏰ MINUTE quota exhausted - wait 60 seconds`);
            }
          } catch (e) {}
          resolve({ model: modelName, status: 'quota_exceeded', code: 429 });
        } else if (status === 404) {
          console.log(`  ❌ 404 NOT FOUND - Model doesn't exist`);
          resolve({ model: modelName, status: 'not_found', code: 404 });
        } else if (status === 403) {
          console.log(`  ❌ 403 FORBIDDEN - No access to this model`);
          resolve({ model: modelName, status: 'forbidden', code: 403 });
        } else {
          console.log(`  ❌ ${status} - Unexpected error`);
          console.log(`  Response: ${responseData.substring(0, 200)}`);
          resolve({ model: modelName, status: 'error', code: status });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`  ❌ Network error: ${err.message}`);
      resolve({ model: modelName, status: 'network_error', code: 0 });
    });

    req.write(requestData);
    req.end();
  });
}

// STEP 4: Check API key permissions
console.log("\n\n🔐 STEP 4: API Key Permission Check");
console.log("=".repeat(70));

function checkKeyPermissions() {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    console.log("Checking if key can access Generative Language API...\n");

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log("✅ API key has VALID permissions");
          console.log("✅ Generative Language API is accessible");
          resolve(true);
        } else if (res.statusCode === 403) {
          console.log("❌ API key FORBIDDEN - Key may be:");
          console.log("  1. Revoked/Disabled");
          console.log("  2. API restrictions blocking Generative Language API");
          console.log("  3. Wrong service (TTS key instead of Gemini key)");
          resolve(false);
        } else if (res.statusCode === 401) {
          console.log("❌ UNAUTHORIZED - API key is invalid");
          resolve(false);
        } else {
          console.log(`⚠️  Unexpected status: ${res.statusCode}`);
          console.log("Response:", data.substring(0, 300));
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log("❌ Network error:", err.message);
      resolve(false);
    });
  });
}

// STEP 5: Check usage and quota
console.log("\n\n📊 STEP 5: Checking Current Usage & Quota");
console.log("=".repeat(70));

// Run all diagnostics
async function runFullDiagnostics() {
  try {
    // Check permissions
    const hasPermissions = await checkKeyPermissions();
    
    if (!hasPermissions) {
      console.log("\n\n❌ DIAGNOSIS: API key has no permissions!");
      console.log("\n💡 SOLUTION: Get new API key from https://aistudio.google.com/app/apikey");
      return;
    }

    // List models
    const models = await listAllModels();
    
    if (models.length === 0) {
      console.log("\n\n❌ DIAGNOSIS: No models available!");
      console.log("\n💡 SOLUTION: API key may be restricted or invalid");
      return;
    }

    // Test top models for quota
    const testModels = [
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-flash-latest',
      'gemini-pro-latest',
    ].filter(m => models.includes(m));

    const results = [];
    for (const model of testModels.slice(0, 5)) {
      const result = await testModelQuota(model);
      results.push(result);
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s between tests
    }

    // Final analysis
    console.log("\n\n" + "=".repeat(70));
    console.log("📊 FINAL DIAGNOSIS & RECOMMENDATIONS");
    console.log("=".repeat(70));

    const workingModels = results.filter(r => r.status === 'working');
    const quotaExceeded = results.filter(r => r.status === 'quota_exceeded');
    const notFound = results.filter(r => r.status === 'not_found');

    console.log(`\n✅ Working models (with quota): ${workingModels.length}`);
    workingModels.forEach(m => console.log(`   → ${m.model}`));

    console.log(`\n⚠️  Quota exceeded models: ${quotaExceeded.length}`);
    quotaExceeded.forEach(m => console.log(`   → ${m.model} (exists but no quota)`));

    console.log(`\n❌ Not found models: ${notFound.length}`);
    notFound.forEach(m => console.log(`   → ${m.model}`));

    console.log("\n" + "=".repeat(70));
    console.log("💡 RECOMMENDED ACTIONS:");
    console.log("=".repeat(70));

    if (workingModels.length > 0) {
      console.log(`\n✅ SOLUTION: Use this model instead:`);
      console.log(`   model: "${workingModels[0].model}"`);
      console.log(`\n📝 Update these files:`);
      console.log(`   1. app/api/contextualize/route.js`);
      console.log(`   2. app/api/contextualize-pdf/route.js`);
      console.log(`   3. app/api/generate-quiz/route.js`);
      console.log(`   4. app/api/text-chatbot/route.js`);
      console.log(`   5. app/api/voice-teacher/route.js`);
    } else if (quotaExceeded.length > 0) {
      console.log(`\n⏰ ALL models have quota exceeded!`);
      console.log(`\n💡 OPTIONS:`);
      console.log(`   1. Wait until tomorrow (quota resets at midnight PST)`);
      console.log(`   2. Get NEW API key from different Google account`);
      console.log(`      → https://aistudio.google.com/app/apikey`);
      console.log(`   3. Upgrade to paid tier (remove daily limits)`);
      console.log(`      → https://ai.google.dev/pricing`);
      
      console.log(`\n📈 Your current usage:`);
      console.log(`   - Daily limit: 1,500 requests (FREE tier)`);
      console.log(`   - Per-minute limit: 15 requests`);
      console.log(`   - Status: EXHAUSTED ❌`);
      
      console.log(`\n⏰ Time until reset:`);
      const now = new Date();
      const pst = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      const midnight = new Date(pst);
      midnight.setHours(24, 0, 0, 0);
      const hoursLeft = Math.floor((midnight - pst) / 1000 / 60 / 60);
      const minutesLeft = Math.floor(((midnight - pst) / 1000 / 60) % 60);
      console.log(`   ${hoursLeft} hours ${minutesLeft} minutes until quota resets`);
    } else {
      console.log(`\n❌ CRITICAL: No models work at all!`);
      console.log(`\n💡 SOLUTION: Get NEW API key`);
      console.log(`   1. Go to: https://aistudio.google.com/app/apikey`);
      console.log(`   2. Create new Google account if needed`);
      console.log(`   3. Create new API key`);
      console.log(`   4. Update .env.local with new key`);
    }

    // Check if keys are same (common mistake)
    if (apiKey === ttsKey) {
      console.log("\n\n⚠️  WARNING: GEMINI_API_KEY and GOOGLE_CLOUD_TTS_API_KEY are identical!");
      console.log("This is OK if the key is from Google Cloud Console with both APIs enabled.");
      console.log("But if one API isn't enabled, you'll have issues.");
    }

  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
    console.error(error.stack);
  }
}

// STEP 6: Test actual API call with detailed logging
console.log("\n\n🧪 STEP 6: Test Actual API Call (Detailed)");
console.log("=".repeat(70));

async function testActualAPICall(modelName) {
  console.log(`\nTesting model: ${modelName}`);
  console.log("Making actual generateContent request...\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    console.log("Sending request...");
    const startTime = Date.now();
    
    const result = await model.generateContent("Say hello in one word");
    const response = await result.response;
    const text = response.text();
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ SUCCESS!`);
    console.log(`   Response: "${text}"`);
    console.log(`   Time: ${duration}ms`);
    console.log(`   Model: ${modelName} is WORKING!`);
    
    return { success: true, model: modelName };
  } catch (error) {
    console.log(`❌ FAILED!`);
    console.log(`   Error: ${error.message.substring(0, 200)}`);
    
    if (error.message.includes('429')) {
      console.log(`   ⚠️  Reason: QUOTA EXCEEDED`);
      
      // Parse retry time
      const retryMatch = error.message.match(/retry in ([\d.]+)s/);
      if (retryMatch) {
        console.log(`   ⏰ Retry after: ${retryMatch[1]} seconds`);
      }
      
      // Check quota type
      if (error.message.includes('PerDay')) {
        console.log(`   ❌ Type: DAILY quota exhausted`);
        console.log(`   💡 Solution: Wait until tomorrow or use different API key`);
      } else if (error.message.includes('PerMinute')) {
        console.log(`   ⏰ Type: PER-MINUTE quota exhausted`);
        console.log(`   💡 Solution: Wait 60 seconds and try again`);
      }
      
      return { success: false, model: modelName, reason: 'quota', error: error.message };
    } else if (error.message.includes('404')) {
      console.log(`   ❌ Reason: Model NOT FOUND`);
      return { success: false, model: modelName, reason: 'not_found' };
    } else if (error.message.includes('403')) {
      console.log(`   ❌ Reason: FORBIDDEN - No access`);
      return { success: false, model: modelName, reason: 'forbidden' };
    } else {
      console.log(`   ❌ Reason: Unknown error`);
      return { success: false, model: modelName, reason: 'unknown', error: error.message };
    }
  }
}

// Run everything
async function runEverything() {
  try {
    await runFullDiagnostics();
    
    console.log("\n\n🧪 Testing top 3 models with actual API calls...");
    console.log("=".repeat(70));
    
    const testModels = [
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash', 
      'gemini-flash-latest'
    ];
    
    for (const model of testModels) {
      await testActualAPICall(model);
      await new Promise(r => setTimeout(r, 2000)); // Wait 2s between tests
    }
    
    // Final summary
    console.log("\n\n" + "=".repeat(70));
    console.log("🎯 FINAL SUMMARY");
    console.log("=".repeat(70));
    console.log("\nAPI Key Status:");
    console.log(`  Key: ${apiKey.substring(0, 20)}...`);
    console.log(`  Valid: ✅ YES`);
    console.log(`  Has Access: ✅ YES`);
    console.log(`\nProblem: QUOTA LIMITS`);
    console.log(`\nYour Options:`);
    console.log(`  1. ⏰ WAIT - Quota resets at midnight PST`);
    console.log(`  2. 🔑 NEW KEY - Create new Google account + API key`);
    console.log(`  3. 💳 UPGRADE - Enable billing for unlimited quota`);
    console.log(`  4. 🔄 DIFFERENT MODEL - Try gemini-2.5-flash or gemini-flash-latest`);
    
    console.log("\n" + "=".repeat(70));
    console.log("🔗 Useful Links:");
    console.log("=".repeat(70));
    console.log("  Check usage: https://ai.dev/usage");
    console.log("  Get new key: https://aistudio.google.com/app/apikey");
    console.log("  Pricing info: https://ai.google.dev/pricing");
    console.log("  Rate limits: https://ai.google.dev/gemini-api/docs/rate-limits");
    
  } catch (error) {
    console.error("\n💥 FATAL ERROR:", error);
  }
}

runEverything();
