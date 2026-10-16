import React from "react";
import { Text as RNText, TextProps, TextStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { TypeVariant, typeScale } from "../theme/tokens";

type Tone = "default" | "secondary" | "muted" | "accent" | "level" | "onAccent" | "alert";

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
}

/** Display variants hold fixed-size numbers (B2, 48 m) that must not reflow. */
const DISPLAY: TypeVariant[] = ["levelHero", "metricHero", "title", "metric", "action"];

/**
 * v2 replacement for AppText. Keeps the v1 idea of capping font scaling
 * (layouts stay stable across Android OEM settings) but no longer disables
 * it completely: body text may grow to 130% for users who need it.
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
      maxFontSizeMultiplier={DISPLAY.includes(variant) ? 1.0 : 1.3}
      style={[base, style]}
      {...rest}
    />
  );
}
