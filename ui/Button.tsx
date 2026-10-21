import React from "react";
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, touchTarget } from "../theme/tokens";
import { Text } from "./Text";

type Kind = "primary" | "danger" | "outline" | "ghost";
type Size = "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  kind?: Kind;
  size?: Size;
  icon?: React.ReactNode;
  loading?: boolean;
  style?: ViewStyle;
}

/**
 * Pill button. `primary` = the one Volt action on a screen (PARK, FIND MY CAR,
 * SAVE SPOT); `danger` = Flare, for irreversible actions (DELETE). Both use the
 * display face in caps; other kinds use the UI face.
 */
export function Button({ label, kind = "outline", size = "md", icon, loading, disabled, style, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const height = size === "lg" ? 60 : 52;
  /** Filled buttons use the display face in caps. */
  const solid = kind === "primary" || kind === "danger";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { height, minHeight: touchTarget },
        kind === "primary" && { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        kind === "danger" && { backgroundColor: colors.alert, opacity: pressed ? 0.85 : 1 },
        kind === "outline" && { borderWidth: 1, borderColor: colors.border, backgroundColor: pressed ? colors.surface : "transparent" },
        kind === "ghost" && { backgroundColor: pressed ? colors.surface : "transparent" },
        disabled && { opacity: 0.45 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={kind === "primary" ? colors.onAccent : kind === "danger" ? colors.onAlert : colors.text} />
      ) : (
        <View style={styles.row}>
          {icon}
          {/* One line always: shrinks a little before it would wrap (narrow screen, large text). */}
          <Text
            variant={solid ? "action" : "smallStrong"}
            tone={kind === "primary" ? "onAccent" : "default"}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[styles.label, kind === "danger" && { color: colors.onAlert }]}
          >
            {solid ? label.toUpperCase() : label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, maxWidth: "100%" },
  label: { flexShrink: 1 },
});
