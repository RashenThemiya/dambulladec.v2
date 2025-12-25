// src/i18n/i18n.js

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files (English, Sinhala, Tamil)
import enTranslation from "../locales/en.json";
import siTranslation from "../locales/si.json";
import taTranslation from "../locales/ta.json";

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    si: { translation: siTranslation },
    ta: { translation: taTranslation },
  },
  lng: "en", // default language
  fallbackLng: "en", // fallback language if translation is not available
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
