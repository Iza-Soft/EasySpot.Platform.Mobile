import { useLocales } from "expo-localization";
import { useEffect } from "react";
import { AppState } from "react-native";
import { syncLanguageWithDevice } from "../i18n";
import { usePrefs } from "../state/prefs";

/**
 * Follows the phone's language live: when the user changes it in the system
 * settings and comes back, every text switches at once — no app restart.
 * useLocales() re-renders on a locale change; the AppState check covers
 * phones that only report it when the app returns to the foreground.
 */
export function useLanguageSync() {
  const locales = useLocales();
  const { language } = usePrefs(); // the in-app choice (Settings → Language)
  useEffect(() => {
    syncLanguageWithDevice();
  }, [locales, language]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") syncLanguageWithDevice();
    });
    return () => sub.remove();
  }, []);
}
