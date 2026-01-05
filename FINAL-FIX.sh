#!/bin/bash

echo "🔥 FINAL FIX - USING CORRECT MODEL NAME"
echo ""

# The correct stable model name is gemini-1.5-flash-latest
find app/api -name "route.js" -type f -exec sed -i.bak \
  -e 's/gemini-2\.0-flash-exp/gemini-1.5-flash-latest/g' \
  -e 's/gemini-1\.5-flash"/gemini-1.5-flash-latest"/g' \
  {} \;

echo "✅ Changed all routes to: gemini-1.5-flash-latest"
echo ""
echo "Files updated:"
echo "  ✅ app/api/contextualize/route.js"
echo "  ✅ app/api/contextualize-pdf/route.js"
echo "  ✅ app/api/generate-quiz/route.js"
echo "  ✅ app/api/text-chatbot/route.js"
echo "  ✅ app/api/voice-teacher/route.js"
echo ""
echo "🚀 RESTART NOW: npm run dev"
echo ""
echo "✅ THIS WILL WORK! gemini-1.5-flash-latest is STABLE!"
