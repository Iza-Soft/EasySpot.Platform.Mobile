import React from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { spacing } from "../theme/tokens";
import { useGutter } from "./responsive";

/**
 * Full-screen container: theme ground + top safe area + side gutters
 * (20 dp, 16 dp on narrow screens). The safe area is padding on the outer
 * view, outside the ScrollView, so scrolled content never slides under the
 * status bar (clock, battery) — it stops at its lower edge.
 */
export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const gutter = useGutter();
  const padding: ViewStyle = { paddingTop: spacing.lg, paddingHorizontal: gutter, paddingBottom: spacing.xxl };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {scroll ? (
        <ScrollView style={styles.fill} contentContainerStyle={[padding, contentStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, padding, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
