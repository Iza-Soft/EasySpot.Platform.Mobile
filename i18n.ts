import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import en from "./locales/en.json";
import bg from "./locales/bg.json";

//const deviceLanguage = getLocales()[0]?.languageCode ?? "en";
const deviceLanguage = "bg";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bg: { translation: bg },
  },
  lng: deviceLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v3", // 🔄 v3 → v4
});

export default i18n;
