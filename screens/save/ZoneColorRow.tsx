import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { ZONE_COLORS } from "../../domain/zone-color";
import { useTheme } from "../../theme/ThemeProvider";
import { Text } from "../../ui";

/**
 * Zone colour (8 colours, optional). Tap to choose, tap again to clear.
 * Filled by the photo when the zone sign is clearly coloured.
 */
export function ZoneColorRow({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <View style={styles.head}>
        <Text variant="overline" tone="muted">{t("v2.save.zone_color")}</Text>
        <Text variant="small" tone="muted">{t("v2.save.optional_short")}</Text>
      </View>
      <View style={styles.row} accessibilityRole="radiogroup">
        {ZONE_COLORS.map((c) => {
          const selected = value === c.key;
          const light = c.key === "white" || c.key === "yellow";
          return (
            <Pressable
              key={c.key}
              accessibilityRole="radio"
              accessibilityLabel={t(`v2.colors.${c.key}`)}
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? null : c.key)}
              hitSlop={4}
              style={[styles.hit, selected && { borderColor: colors.accentFg }]}
            >
              <View style={[styles.dot, { backgroundColor: c.hex, borderColor: colors.border }]}>
                {selected ? <Ionicons name="checkmark" size={18} color={light ? "#111" : "#fff"} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  hit: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
