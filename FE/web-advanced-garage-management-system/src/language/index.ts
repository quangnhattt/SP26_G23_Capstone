import LocalStorage from "@/apis/LocalStorage";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

const savedLanguage = LocalStorage.getLanguage() || "en";

i18next.use(initReactI18next).init({
  compatibilityJSON: "v4",
  lng: savedLanguage,
  fallbackLng: "en",
  debug: false, // Disable debug in production
  resources: {}, // Start with empty resources
  // Lazy load translations
  backend: {
    loadPath: '/locales/{{lng}}.json',
  },
});

// Dynamically import translations
const loadLanguage = async (lang: string) => {
  try {
    const translation = await import(`./locales/${lang}.ts`);
    i18next.addResourceBundle(lang, 'translation', translation.default, true, true);
  } catch (error) {
    console.error(`Failed to load language: ${lang}`, error);
  }
};

// Load initial language
loadLanguage(savedLanguage);

export default i18next;
