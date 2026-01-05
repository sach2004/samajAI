#!/bin/bash

echo "🔄 Switching to stable Gemini model..."
echo ""

# Change from experimental to stable model
find app/api -name "route.js" -type f -exec sed -i.bak 's/gemini-2\.0-flash-exp/gemini-1.5-flash/g' {} \;

echo "✅ Changed all routes from gemini-2.0-flash-exp to gemini-1.5-flash"
echo ""
echo "Files updated:"
echo "  ✅ app/api/contextualize/route.js"
echo "  ✅ app/api/contextualize-pdf/route.js"
echo "  ✅ app/api/generate-quiz/route.js"
echo "  ✅ app/api/text-chatbot/route.js"
echo "  ✅ app/api/voice-teacher/route.js"
echo ""
echo "🚀 Now restart: npm run dev"
