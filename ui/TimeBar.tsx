import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Remaining paid time as a bar (replaces the ring). Volt; Flare under 15 %;
 * at 0 the bar is full Flare ("time is up"). Fixed height: never reflows.
 */
export function TimeBar({ fraction, height = 6, expired }: { fraction: number; height?: number; expired?: boolean }) {
  const { colors } = useTheme();
  const f = Math.max(0, Math.min(1, fraction));
  const color = expired || f < 0.15 ? colors.alert : colors.accentFg;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(f * 100) }}
      style={[styles.track, { height, borderRadius: height, backgroundColor: colors.border }]}
    >
      <View style={{ width: `${expired ? 100 : f * 100}%`, height: "100%", borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({ track: { overflow: "hidden", width: "100%" } });
