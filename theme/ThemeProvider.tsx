import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { ThemeColors, ThemeName, themes } from "./tokens";

export type ThemePreference = "system" | ThemeName;

const STORAGE_KEY = "@theme_preference";

interface ThemeContextValue {
  name: ThemeName;
  colors: ThemeColors;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Dark is the product default (fresh installs look like the store
 * screenshots). The choice made in Settings is persisted in AsyncStorage.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("dark");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "dark" || v === "light" || v === "system") setPreferenceState(v);
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const name: ThemeName = preference === "system" ? (system === "light" ? "light" : "dark") : preference;
    return {
      name,
      colors: themes[name],
      preference,
      setPreference: (p) => {
        setPreferenceState(p);
        AsyncStorage.setItem(STORAGE_KEY, p).catch(() => undefined);
      },
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
