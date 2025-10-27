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

// Website translations
export const WEBSITE_TRANSLATIONS = {
  en: {
    title: "ContextAI 🌏",
    tagline: "Make EdTech Feel Like Home",
    transformTitle: "Transform Educational Videos",
    transformDesc: "Convert English educational content into culturally relevant Indian language versions",
    urlLabel: "YouTube Video URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "Enter any educational YouTube video with English captions",
    targetLangLabel: "Target Language",
    regionLabel: "Regional Context",
    regionHint: "Adapt examples and references to this region",
    voiceLabel: "Voice Gender",
    submitButton: "🚀 Contextualize Video",
    exampleTitle: "Example Transformation:",
    newVideo: "← New Video",
  },
  hi: {
    title: "ContextAI 🌏",
    tagline: "शिक्षा को घर जैसा बनाएं",
    transformTitle: "शैक्षिक वीडियो को बदलें",
    transformDesc: "अंग्रेजी शैक्षिक सामग्री को सांस्कृतिक रूप से प्रासंगिक भारतीय भाषा संस्करणों में बदलें",
    urlLabel: "YouTube वीडियो URL",
    urlPlaceholder: "https://www.youtube.com/watch?v=...",
    urlHint: "अंग्रेजी कैप्शन वाला कोई भी शैक्षिक YouTube वीडियो दर्ज करें",
    targetLangLabel: "लक्ष्य भाषा",
    regionLabel: "क्षेत्रीय संदर्भ",
    regionHint: "इस क्षेत्र के उदाहरण और संदर्भ अपनाएं",
    voiceLabel: "आवाज़ का लिंग",
    submitButton: "🚀 वीडियो को बदलें",
    exampleTitle: "उदाहरण परिवर्तन:",
    newVideo: "← नया वीडियो",
  },
};
