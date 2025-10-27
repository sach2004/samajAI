export const SUPPORTED_LANGUAGES = [
  { value: "hi", label: "Hindi (हिंदी)" },
  { value: "ta", label: "Tamil (தமிழ்)" },
  { value: "te", label: "Telugu (తెలుగు)" },
  { value: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { value: "ml", label: "Malayalam (മലയാളം)" },
  { value: "bn", label: "Bengali (বাংলা)" },
  { value: "mr", label: "Marathi (मराठी)" },
  { value: "gu", label: "Gujarati (ગુજરાતી)" },
];

export const REGIONS = [
  { value: "urban-delhi", label: "Urban Delhi" },
  { value: "urban-mumbai", label: "Urban Mumbai" },
  { value: "urban-bangalore", label: "Urban Bangalore" },
  { value: "urban-chennai", label: "Urban Chennai" },
  { value: "urban-kolkata", label: "Urban Kolkata" },
  { value: "urban-hyderabad", label: "Urban Hyderabad" },
  { value: "rural-punjab", label: "Rural Punjab" },
  { value: "rural-up", label: "Rural Uttar Pradesh" },
  { value: "rural-bihar", label: "Rural Bihar" },
  { value: "rural-maharashtra", label: "Rural Maharashtra" },
];

export const VOICE_OPTIONS = [
  { value: "male", label: "Male Voice" },
  { value: "female", label: "Female Voice" },
];

export const LANGUAGE_CODES = {
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
};

export const LANGUAGE_NAMES = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
};

// Voice map with gender options
export const VOICE_MAP = {
  hi: {
    male: "hi-IN-Wavenet-B",
    female: "hi-IN-Wavenet-D",
  },
  ta: {
    male: "ta-IN-Wavenet-B",
    female: "ta-IN-Wavenet-A",
  },
  te: {
    male: "te-IN-Standard-B",
    female: "te-IN-Standard-A",
  },
  bn: {
    male: "bn-IN-Wavenet-B",
    female: "bn-IN-Wavenet-A",
  },
  kn: {
    male: "kn-IN-Wavenet-B",
    female: "kn-IN-Wavenet-A",
  },
  ml: {
    male: "ml-IN-Wavenet-B",
    female: "ml-IN-Wavenet-A",
  },
  gu: {
    male: "gu-IN-Wavenet-B",
    female: "gu-IN-Wavenet-A",
  },
  mr: {
    male: "mr-IN-Wavenet-B",
    female: "mr-IN-Wavenet-A",
  },
};

// Website translations for ALL 8 supported languages
export const WEBSITE_TRANSLATIONS = {
  en: {
    title: "ContextAI 🌏",
    tagline: "Make EdTech Feel Like Home",
    transformTitle: "Transform Educational Videos",
    transformDesc:
      "Convert English educational content into culturally relevant Indian language versions",
    urlLabel: "YouTube Video URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "Enter any educational YouTube video with English captions",
    targetLangLabel: "Target Language",
    regionLabel: "Regional Context",
    regionHint: "Adapt examples and references to this region",
    voiceLabel: "Voice Gender",
    websiteLangLabel: "Website Language",
    submitButton: "🚀 Contextualize Video",
    exampleTitle: "Example Transformation:",
    newVideo: "← New Video",
  },
  hi: {
    title: "ContextAI 🌏",
    tagline: "शिक्षा को घर जैसा बनाएं",
    transformTitle: "शैक्षिक वीडियो को बदलें",
    transformDesc:
      "अंग्रेजी शैक्षिक सामग्री को सांस्कृतिक रूप से प्रासंगिक भारतीय भाषा संस्करणों में बदलें",
    urlLabel: "YouTube वीडियो URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "अंग्रेजी कैप्शन वाला कोई भी शैक्षिक YouTube वीडियो दर्ज करें",
    targetLangLabel: "लक्ष्य भाषा",
    regionLabel: "क्षेत्रीय संदर्भ",
    regionHint: "इस क्षेत्र के उदाहरण और संदर्भ अपनाएं",
    voiceLabel: "आवाज़ का लिंग",
    websiteLangLabel: "वेबसाइट भाषा",
    submitButton: "🚀 वीडियो को बदलें",
    exampleTitle: "उदाहरण परिवर्तन:",
    newVideo: "← नया वीडियो",
  },
  ta: {
    title: "ContextAI 🌏",
    tagline: "கல்வியை வீடு போல உணரச் செய்யுங்கள்",
    transformTitle: "கல்வி வீடியோக்களை மாற்றுங்கள்",
    transformDesc:
      "ஆங்கில கல்வி உள்ளடக்கத்தை கலாச்சார ரீதியாக தொடர்புடைய இந்திய மொழி பதிப்புகளாக மாற்றுங்கள்",
    urlLabel: "YouTube வீடியோ URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "ஆங்கில வசன வரிகளுடன் எந்த கல்வி YouTube வீடியோவையும் உள்ளிடவும்",
    targetLangLabel: "இலக்கு மொழி",
    regionLabel: "பிராந்திய சூழல்",
    regionHint: "இந்த பகுதிக்கு எடுத்துக்காட்டுகளை மாற்றியமைக்கவும்",
    voiceLabel: "குரல் பாலினம்",
    websiteLangLabel: "வலைத்தள மொழி",
    submitButton: "🚀 வீடியோவை மாற்று",
    exampleTitle: "மாற்றம் உதாரணம்:",
    newVideo: "← புதிய வீடியோ",
  },
  te: {
    title: "ContextAI 🌏",
    tagline: "విద్యను ఇంటిలా అనిపించేలా చేయండి",
    transformTitle: "విద్యా వీడియోలను మార్చండి",
    transformDesc:
      "ఆంగ్ల విద్యా కంటెంట్‌ను సాంస్కృతికంగా సంబంధిత భారతీయ భాషా వెర్షన్‌లుగా మార్చండి",
    urlLabel: "YouTube వీడియో URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "ఆంగ్ల క్యాప్షన్‌లతో ఏదైనా విద్యా YouTube వీడియోను నమోదు చేయండి",
    targetLangLabel: "లక్ష్య భాష",
    regionLabel: "ప్రాంతీయ సందర్భం",
    regionHint: "ఈ ప్రాంతానికి ఉదాహరణలను స్వీకరించండి",
    voiceLabel: "వాయిస్ లింగం",
    websiteLangLabel: "వెబ్‌సైట్ భాష",
    submitButton: "🚀 వీడియోను మార్చండి",
    exampleTitle: "మార్పు ఉదాహరణ:",
    newVideo: "← కొత్త వీడియో",
  },
  kn: {
    title: "ContextAI 🌏",
    tagline: "ಶಿಕ್ಷಣವನ್ನು ಮನೆಯಂತೆ ಅನುಭವಿಸಿ",
    transformTitle: "ಶೈಕ್ಷಣಿಕ ವೀಡಿಯೊಗಳನ್ನು ಪರಿವರ್ತಿಸಿ",
    transformDesc:
      "ಇಂಗ್ಲಿಷ್ ಶೈಕ್ಷಣಿಕ ವಿಷಯವನ್ನು ಸಾಂಸ್ಕೃತಿಕವಾಗಿ ಸಂಬಂಧಿತ ಭಾರತೀಯ ಭಾಷಾ ಆವೃತ್ತಿಗಳಾಗಿ ಪರಿವರ್ತಿಸಿ",
    urlLabel: "YouTube ವೀಡಿಯೊ URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint:
      "ಇಂಗ್ಲಿಷ್ ಶೀರ್ಷಿಕೆಗಳೊಂದಿಗೆ ಯಾವುದೇ ಶೈಕ್ಷಣಿಕ YouTube ವೀಡಿಯೊವನ್ನು ನಮೂದಿಸಿ",
    targetLangLabel: "ಗುರಿ ಭಾಷೆ",
    regionLabel: "ಪ್ರಾದೇಶಿಕ ಸಂದರ್ಭ",
    regionHint: "ಈ ಪ್ರದೇಶಕ್ಕೆ ಉದಾಹರಣೆಗಳನ್ನು ಅಳವಡಿಸಿ",
    voiceLabel: "ಧ್ವನಿ ಲಿಂಗ",
    websiteLangLabel: "ವೆಬ್‌ಸೈಟ್ ಭಾಷೆ",
    submitButton: "🚀 ವೀಡಿಯೊವನ್ನು ಪರಿವರ್ತಿಸಿ",
    exampleTitle: "ಪರಿವರ್ತನೆ ಉದಾಹರಣೆ:",
    newVideo: "← ಹೊಸ ವೀಡಿಯೊ",
  },
  ml: {
    title: "ContextAI 🌏",
    tagline: "വിദ്യാഭ്യാസം വീട് പോലെ അനുഭവപ്പെടുത്തുക",
    transformTitle: "വിദ്യാഭ്യാസ വീഡിയോകൾ മാറ്റുക",
    transformDesc:
      "ഇംഗ്ലീഷ് വിദ്യാഭ്യാസ ഉള്ളടക്കം സാംസ്കാരികമായി പ്രസക്തമായ ഇന്ത്യൻ ഭാഷാ പതിപ്പുകളായി മാറ്റുക",
    urlLabel: "YouTube വീഡിയോ URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint:
      "ഇംഗ്ലീഷ് അടിക്കുറിപ്പുകളുള്ള ഏതെങ്കിലും വിദ്യാഭ്യാസ YouTube വീഡിയോ നൽകുക",
    targetLangLabel: "ലക്ഷ്യ ഭാഷ",
    regionLabel: "പ്രാദേശിക സന്ദർഭം",
    regionHint: "ഈ പ്രദേശത്തേക്ക് ഉദാഹരണങ്ങൾ സ്വീകരിക്കുക",
    voiceLabel: "ശബ്ദ ലിംഗം",
    websiteLangLabel: "വെബ്‌സൈറ്റ് ഭാഷ",
    submitButton: "🚀 വീഡിയോ മാറ്റുക",
    exampleTitle: "പരിവർത്തന ഉദാഹരണം:",
    newVideo: "← പുതിയ വീഡിയോ",
  },
  bn: {
    title: "ContextAI 🌏",
    tagline: "শিক্ষাকে বাড়ির মতো মনে করান",
    transformTitle: "শিক্ষামূলক ভিডিও রূপান্তর করুন",
    transformDesc:
      "ইংরেজি শিক্ষামূলক বিষয়বস্তুকে সাংস্কৃতিকভাবে প্রাসঙ্গিক ভারতীয় ভাষার সংস্করণে রূপান্তর করুন",
    urlLabel: "YouTube ভিডিও URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "ইংরেজি ক্যাপশন সহ যেকোনো শিক্ষামূলক YouTube ভিডিও প্রবেশ করান",
    targetLangLabel: "লক্ষ্য ভাষা",
    regionLabel: "আঞ্চলিক প্রসঙ্গ",
    regionHint: "এই অঞ্চলের উদাহরণ গ্রহণ করুন",
    voiceLabel: "কণ্ঠ লিঙ্গ",
    websiteLangLabel: "ওয়েবসাইট ভাষা",
    submitButton: "🚀 ভিডিও রূপান্তর করুন",
    exampleTitle: "রূপান্তরের উদাহরণ:",
    newVideo: "← নতুন ভিডিও",
  },
  mr: {
    title: "ContextAI 🌏",
    tagline: "शिक्षण घरासारखे वाटू द्या",
    transformTitle: "शैक्षणिक व्हिडिओ बदला",
    transformDesc:
      "इंग्रजी शैक्षणिक सामग्री सांस्कृतिकदृष्ट्या संबंधित भारतीय भाषेच्या आवृत्त्यांमध्ये रूपांतरित करा",
    urlLabel: "YouTube व्हिडिओ URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint:
      "इंग्रजी मथळे असलेला कोणताही शैक्षणिक YouTube व्हिडिओ प्रविष्ट करा",
    targetLangLabel: "लक्ष्य भाषा",
    regionLabel: "प्रादेशिक संदर्भ",
    regionHint: "या प्रदेशासाठी उदाहरणे स्वीकारा",
    voiceLabel: "आवाज लिंग",
    websiteLangLabel: "वेबसाइट भाषा",
    submitButton: "🚀 व्हिडिओ बदला",
    exampleTitle: "रूपांतरण उदाहरण:",
    newVideo: "← नवीन व्हिडिओ",
  },
  gu: {
    title: "ContextAI 🌏",
    tagline: "શિક્ષણને ઘર જેવું લાગવા દો",
    transformTitle: "શૈક્ષણિક વિડિઓઝ રૂપાંતરિત કરો",
    transformDesc:
      "અંગ્રેજી શૈક્ષણિક સામગ્રીને સાંસ્કૃતિક રીતે સંબંધિત ભારતીય ભાષા સંસ્કરણોમાં રૂપાંતરિત કરો",
    urlLabel: "YouTube વિડિઓ URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "અંગ્રેજી કૅપ્શન્સ સાથે કોઈપણ શૈક્ષણિક YouTube વિડિઓ દાખલ કરો",
    targetLangLabel: "લક્ષ્ય ભાષા",
    regionLabel: "પ્રાદેશિક સંદર્ભ",
    regionHint: "આ પ્રદેશ માટે ઉદાહરણો અપનાવો",
    voiceLabel: "અવાજ લિંગ",
    websiteLangLabel: "વેબસાઇટ ભાષા",
    submitButton: "🚀 વિડિઓ રૂપાંતરિત કરો",
    exampleTitle: "રૂપાંતરણ ઉદાહરણ:",
    newVideo: "← નવો વિડિઓ",
  },
};
