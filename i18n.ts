import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { getPrefs } from "./state/prefs";

import en from "./locales/en.json";
import bg from "./locales/bg.json";
import tr from "./locales/tr.json";
import ru from "./locales/ru.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import ro from "./locales/ro.json";

/** The app speaks the phone's language; anything else falls back to English. */
export const SUPPORTED_LANGUAGES = ["en", "bg", "ru", "de", "fr", "tr", "es", "it", "ro"] as const;

/** The phone's current language if we have it, otherwise English. */
export function deviceLanguage(): string {
  const code = getLocales()[0]?.languageCode ?? "en";
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code) ? code : "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bg: { translation: bg },
    tr: { translation: tr },
    ru: { translation: ru },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
    ro: { translation: ro },
  },
  lng: deviceLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v3", // 🔄 v3 → v4
});

/** The language to show: the one picked in Settings, or the phone's. */
export function effectiveLanguage(): string {
  const picked = getPrefs().language;
  return picked && picked !== "system" && (SUPPORTED_LANGUAGES as readonly string[]).includes(picked) ? picked : deviceLanguage();
}

/** Switch right away if the phone's language or the in-app choice changed (no restart needed). */
export function syncLanguageWithDevice() {
  const lang = effectiveLanguage();
  if (i18n.language !== lang) i18n.changeLanguage(lang).catch(() => undefined);
}

export default i18n;
