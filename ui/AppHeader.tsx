import React from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../theme/tokens";
import { HomeLogo } from "./HomeLogo";
import { Text } from "./Text";

/**
 * Top row of every screen: the EasySpot logo (→ Home) on the left, the
 * screen's name on the right in the same type and size as "EASYSPOT".
 */
export function AppHeader({ title, onLogoLongPress }: { title: string; onLogoLongPress?: () => void }) {
  return (
    <View style={styles.row}>
      <HomeLogo onLongPress={onLogoLongPress} />
      <Text
        variant="action"
        tone="muted"
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={styles.title}
      >
        {title.toLocaleUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  title: { flex: 1, textAlign: "right", letterSpacing: 1.5 },
});
