import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing } from "../theme/tokens";
import { Text } from "./Text";

/**
 * Address of a spot, built for long addresses in any country:
 * the street gets the full width and up to 2 lines (so the house number is
 * never cut off — "Abide-i Hürriyet Caddesi No:211"); the area (quarter,
 * city, country) gets up to 2 lines next to the GPS accuracy.
 */
export function AddressCard({ street, area, accuracy }: { street: string; area?: string | null; accuracy?: number | null }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const m = accuracy != null ? Math.round(accuracy) : null;
  // Same thresholds as the GPS tile on Home.
  const tone = m == null ? colors.textMuted : m <= 15 ? colors.accentFg : m <= 50 ? colors.textMuted : colors.alert;

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceRaised }]}>
      <Ionicons name="location" size={20} color={colors.accentFg} style={styles.pin} />
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={2}>{street}</Text>
        <View style={styles.row}>
          <Text variant="small" tone="muted" numberOfLines={2} style={styles.area}>{area ?? ""}</Text>
          {m != null ? (
            <View
              accessible
              accessibilityLabel={t("v2.save.accuracy", { m })}
              style={[styles.chip, { borderColor: tone }]}
            >
              <View style={[styles.dot, { backgroundColor: tone }]} />
              <Text variant="smallStrong" style={[styles.chipText, { color: tone }]}>±{m} m</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  pin: { marginTop: 1 },
  text: { flex: 1, gap: spacing.xxs },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  area: { flex: 1 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, height: 24, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums"] },
});
