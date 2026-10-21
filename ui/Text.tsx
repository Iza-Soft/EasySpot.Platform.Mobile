import React from "react";
import { Text as RNText, TextProps, TextStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { TypeVariant, typeScale } from "../theme/tokens";
import { FONT_CAP } from "./responsive";

type Tone = "default" | "secondary" | "muted" | "accent" | "level" | "onAccent" | "alert";

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
}

/**
 * How far each variant may grow with the phone's text size (responsive.ts).
 * Display variants hold fixed-size numbers (B2, 48 m) and tiny caps labels
 * that must not reflow; labels and buttons grow a little; reading text a bit more.
 */
const CAP: Record<TypeVariant, number> = {
  levelHero: FONT_CAP.FIXED,
  metricHero: FONT_CAP.FIXED,
  title: FONT_CAP.FIXED,
  metric: FONT_CAP.FIXED,
  action: FONT_CAP.FIXED,
  overline: FONT_CAP.FIXED,
  heading: FONT_CAP.UI,
  bodyStrong: FONT_CAP.UI,
  smallStrong: FONT_CAP.UI,
  body: FONT_CAP.READ,
  small: FONT_CAP.READ,
};

/**
 * v2 replacement for AppText. Keeps the v1 idea of capping font scaling
 * (layouts stay stable across Android OEM settings) but no longer disables
 * it completely. A caller can still pass its own maxFontSizeMultiplier.
 */
export function Text({ variant = "body", tone = "default", style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const color: Record<Tone, string> = {
    default: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    accent: colors.accentFg,
    level: colors.level,
    onAccent: colors.onAccent,
    alert: colors.alert,
  };
  const base: TextStyle = { ...typeScale[variant], color: color[tone] };
  return (
    <RNText
      maxFontSizeMultiplier={CAP[variant] ?? FONT_CAP.UI}
      style={[base, style]}
      {...rest}
    />
  );
}
