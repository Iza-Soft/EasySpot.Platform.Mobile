import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../theme/tokens";
import { FONT_CAP } from "./responsive";
import { Text } from "./Text";

/** "1 floor" / "3 floors" key for the language (ru has a "few" form: 2–4, 22–24 …). */
function countKey(lang: string, n: number): "one" | "few" | "other" {
  if (lang.startsWith("ru")) {
    const d = n % 10;
    const h = n % 100;
    if (d === 1 && h !== 11) return "one";
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return "few";
    return "other";
  }
  return n === 1 ? "one" : "other";
}

/** "3 floors below you" / "4 floors above you" / "On the car's floor". */
export function floorsText(t: TFunction, lang: string, floors: number): string {
  if (floors === 0) return t("v2.floors.same");
  const n = Math.abs(floors);
  const dir = floors > 0 ? "below" : "above"; // above the car → the car is below you
  const key = countKey(lang, n);
  return t(`v2.floors.${dir}_${key}`, { n, defaultValue: t(`v2.floors.${dir}_other`, { n }) });
}

/**
 * The car's floor compared with yours, by air pressure (mockups B1–B4).
 * "card": the row in Parked; "compact": one line in the Spots list.
 */
export function FloorsLine({ floors, compact = false }: { floors: number; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const icon = floors === 0 ? "checkmark" : floors > 0 ? "arrow-down" : "arrow-up";
  const text = floorsText(t, i18n.language, floors);

  if (compact) {
    return (
      <View style={[styles.compact, { borderTopColor: colors.border }]} accessible accessibilityLabel={`${text}, ${t("v2.floors.live")}`}>
        <View style={[styles.dotIcon, { backgroundColor: colors.accent }]}>
          <Ionicons name={icon} size={14} color={colors.onAccent} />
        </View>
        <Text variant="smallStrong" numberOfLines={1} style={{ flexShrink: 1 }}>{text}</Text>
      </View>
    );
  }
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surfaceRaised }]}
      accessible
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${text}, ${t("v2.floors.live")}`}
    >
      <View style={[styles.bigIcon, { backgroundColor: colors.accent }]}>
        <Ionicons name={icon} size={22} color={colors.onAccent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {/* Display face in a fixed card: keeps its size, shrinks a little rather than wrapping oddly. */}
        <Text variant="bodyStrong" maxFontSizeMultiplier={FONT_CAP.FIXED} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.big} numberOfLines={2}>
          {text}
        </Text>
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, { backgroundColor: colors.accentFg }]} />
          <Text variant="small" tone="muted" style={{ flexShrink: 1 }}>{t("v2.floors.live")}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
  bigIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  big: { fontFamily: fontFamily.display, fontSize: 17, lineHeight: 22 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  compact: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  dotIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
});
