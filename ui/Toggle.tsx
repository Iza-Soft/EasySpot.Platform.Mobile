import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

/** On / off switch (mockups S1–S3): Volt when on, grey when off, faded when disabled. Display only — the row handles the tap. */
export function Toggle({ value, disabled = false }: { value: boolean; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: value ? colors.accent : colors.border }, disabled && styles.disabled]}>
      <View style={[styles.knob, { left: value ? 23 : 3, backgroundColor: value ? colors.onAccent : colors.textMuted }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: 52, height: 32, borderRadius: 16 },
  knob: { position: "absolute", top: 3, width: 26, height: 26, borderRadius: 13 },
  disabled: { opacity: 0.4 },
});
