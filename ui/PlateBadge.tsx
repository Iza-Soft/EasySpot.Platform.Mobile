import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Text } from "./Text";

/**
 * The car plate read from the photo, drawn like a plate (mockups F4/F5).
 * Not read → "xxxxxx" (F4b). Yellow on purpose: it reads as "a plate" at a
 * glance, in both themes.
 */
export function PlateBadge({ plate, accessibilityLabel }: { plate?: string | null; accessibilityLabel?: string }) {
  return (
    <View style={styles.plate} accessible accessibilityLabel={accessibilityLabel}>
      <Text variant="smallStrong" style={styles.text} numberOfLines={1}>
        {plate || "xxxxxx"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    minWidth: 84,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#111111",
    backgroundColor: "#F3D20A",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    color: "#111111",
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontWeight: "700",
  },
});
