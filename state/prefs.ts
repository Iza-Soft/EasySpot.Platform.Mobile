import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { LevelLabelStyle } from "../domain/level";

/**
 * Small user preferences from Settings, kept in memory (read synchronously by
 * services) and persisted in AsyncStorage. Loaded once at start-up.
 */
export interface Prefs {
  /** "letter" → B2, "signed" → −2. */
  levelLabels: LevelLabelStyle;
  /** Minutes before the paid time ends for the reminder. */
  remindBeforeMin: number;
  /** "system" = follow the phone; otherwise a language code chosen in the app. */
  language: string;
  /** "Floors to your car" (barometer): on by default; works only on phones with a barometer. */
  floorsEnabled: boolean;
}

export const REMIND_BEFORE_OPTIONS = [5, 10, 15, 30] as const;
const DEFAULTS: Prefs = { levelLabels: "letter", remindBeforeMin: 15, language: "system", floorsEnabled: true };
const KEY = "@prefs_v2";

let prefs: Prefs = DEFAULTS;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function loadPrefs(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) prefs = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    prefs = DEFAULTS;
  }
  emit();
}

export function getPrefs(): Prefs {
  return prefs;
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  prefs = { ...prefs, [key]: value };
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => undefined);
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => prefs,
  );
}

/** Test hook. */
export function __setPrefsForTests(p: Partial<Prefs>) {
  prefs = { ...DEFAULTS, ...p };
}
