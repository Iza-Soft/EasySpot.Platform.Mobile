/**
 * EasySpot 2.0 design tokens — "Night Signal".
 *
 * Dark is the default theme (the app is mostly used in dim garages);
 * light exists for system light mode and shared web pages.
 * Volt is reserved for ONE thing per screen: the primary action or the
 * user's level. Flare is only for "time is running out".
 */

export const palette = {
  ink: "#0E0F13",
  inkDeep: "#07080A",
  carbon: "#1A1C22",
  carbonRaised: "#24272F",
  line: "#2E323B",
  navBar: "#14161B",
  textHigh: "#F2F3F5",
  textMid: "#D0D3D9",
  textLow: "#A3A8B3",
  volt: "#C8F135",
  voltPressed: "#B3DA22",
  flare: "#FF7A45",
  paper: "#F4F5F7",
  paperCard: "#FFFFFF",
  paperLine: "#E1E3E8",
  paperTextLow: "#5A606C",
} as const;

export type ThemeName = "dark" | "light";

export interface ThemeColors {
  background: string;
  backgroundDeep: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  navBar: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  /** Primary action fill. Text on it must use `onAccent`. */
  accent: string;
  /**
   * Volt used as a FOREGROUND (icons, links, radios, badges, Volt borders,
   * thin bars). Same as `accent` on dark; a deeper Volt on light, because
   * Volt on paper is too pale to see.
   */
  accentFg: string;
  accentPressed: string;
  onAccent: string;
  /** The level number colour (B2) when not on an accent fill. */
  level: string;
  alert: string;
  onAlert: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  dark: {
    background: palette.ink,
    backgroundDeep: palette.inkDeep,
    surface: palette.carbon,
    surfaceRaised: palette.carbonRaised,
    border: palette.line,
    navBar: palette.navBar,
    text: palette.textHigh,
    textSecondary: palette.textMid,
    textMuted: palette.textLow,
    accent: palette.volt,
    accentPressed: palette.voltPressed,
    accentFg: palette.volt,
    onAccent: palette.ink,
    level: palette.volt,
    alert: palette.flare,
    onAlert: palette.ink,
  },
  light: {
    background: palette.paper,
    backgroundDeep: "#E9EBEF",
    surface: palette.paperCard,
    surfaceRaised: "#F0F1F4",
    border: palette.paperLine,
    navBar: palette.paperCard,
    text: palette.ink,
    textSecondary: "#3A3F4A",
    textMuted: palette.paperTextLow,
    // A touch darker Volt for fills on paper (PARK, primary buttons) so they stand out.
    accent: "#BEE626",
    accentPressed: "#A9D11A",
    // Deep Volt for icons / links / borders on paper (≈ 3.5:1 on #F4F5F7, option A).
    accentFg: "#6A8F00",
    onAccent: palette.ink,
    // Volt text on paper fails contrast — levels render as ink on light.
    level: palette.ink,
    alert: palette.flare,
    onAlert: palette.ink,
  },
};

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

/** Minimum touch target (Material + HIG). */
export const touchTarget = 44;

/**
 * Font families. Unbounded (display) + Onest (UI) — both cover Latin and
 * Cyrillic, which EasySpot needs for BG/RU. Archivo (used in the first
 * mockups) has no Cyrillic, so it was replaced.
 * Names must match the keys passed to useFonts() in theme/fonts.ts.
 */
export const fontFamily = {
  display: "Unbounded_800ExtraBold",
  displayBlack: "Unbounded_900Black",
  displayBold: "Unbounded_700Bold",
  regular: "Onest_400Regular",
  medium: "Onest_500Medium",
  semibold: "Onest_600SemiBold",
  bold: "Onest_700Bold",
  extrabold: "Onest_800ExtraBold",
} as const;

export const typeScale = {
  /** The level on the Parked screen ("B2"). */
  levelHero: { fontFamily: fontFamily.displayBlack, fontSize: 96, lineHeight: 96, letterSpacing: -3 },
  /** Distance in Find mode ("48 m"). */
  metricHero: { fontFamily: fontFamily.displayBlack, fontSize: 80, lineHeight: 84, letterSpacing: -2 },
  title: { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.5 },
  metric: { fontFamily: fontFamily.display, fontSize: 22, lineHeight: 26 },
  action: { fontFamily: fontFamily.display, fontSize: 16, lineHeight: 20, letterSpacing: 0.5 },
  heading: { fontFamily: fontFamily.extrabold, fontSize: 24, lineHeight: 30 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  smallStrong: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20 },
  /** Uppercase section labels ("YOU'RE AT", "LEVEL"). */
  overline: { fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.5, textTransform: "uppercase" as const },
} as const;

export type TypeVariant = keyof typeof typeScale;
