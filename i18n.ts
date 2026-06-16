import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import en from "./locales/en.json";
import bg from "./locales/bg.json";
import tr from "./locales/tr.json";
import ru from "./locales/ru.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";

const deviceLanguage = getLocales()[0]?.languageCode ?? "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bg: { translation: bg },
    tr: { translation: tr },
    ru: { translation: ru },
    de: { translation: de },
    fr: { translation: fr },
  },
  lng: deviceLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v3", // 🔄 v3 → v4
});

export default i18n;
