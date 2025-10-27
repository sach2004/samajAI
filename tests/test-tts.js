// test-tts.js
async function testTTS() {
  const apiKey = "AIzaSyC165dOjAIUx0nB8HTYARvTJkGBH3wdHFk"; // Replace with your actual key

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const requestBody = {
    input: { text: "नमस्ते, मैं हिंदी में बोल रहा हूं।" },
    voice: {
      languageCode: "hi-IN",
      name: "hi-IN-Wavenet-D",
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Error:", error);
      return;
    }

    const data = await response.json();
    console.log("✅ Success! Audio generated.");
    console.log("Audio data length:", data.audioContent.length);
    console.log("Your TTS API is working perfectly! 🎉");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testTTS();
