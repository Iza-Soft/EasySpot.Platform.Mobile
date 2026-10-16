import React from "react";
import { Pressable, PressableProps, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, touchTarget } from "../theme/tokens";
import { Text } from "./Text";

/** Surface card on the app ground. `highlight` draws the Volt outline (detected level, routine). */
export function Card({ highlight, style, ...rest }: ViewProps & { highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: highlight ? colors.accentFg : colors.border },
        highlight && { borderWidth: 1.5 },
        style,
      ]}
      {...rest}
    />
  );
}

type TagVariant = "solid" | "outline" | "muted";

/** Level / spot tag ("B2", "C14"). solid = Volt with ink text, outline = places, muted = no level. */
export function LevelTag({
  value,
  variant = "solid",
  size = "md",
  icon,
}: {
  value?: string;
  variant?: TagVariant;
  size?: "sm" | "md";
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const h = size === "sm" ? 36 : 44;
  const box: ViewStyle =
    variant === "solid"
      ? { backgroundColor: colors.accent }
      : variant === "outline"
        ? { borderWidth: 1.5, borderColor: colors.text }
        : { backgroundColor: colors.surfaceRaised };
  return (
    <View style={[styles.tag, { height: h, minWidth: h + 8 }, box]}>
      {icon ?? (
        <Text
          variant="metric"
          tone={variant === "solid" ? "onAccent" : variant === "muted" ? "secondary" : "default"}
          style={{ fontSize: (value?.length ?? 0) > 3 ? 13 : size === "sm" ? 15 : 18, lineHeight: 22 }}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

/** Small status pill ("2 levels down", "GPS ±4 m"). */
export function Chip({ label, dot, style }: { label: string; dot?: boolean; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: colors.accentFg }]} />}
      <Text variant="smallStrong">{label}</Text>
    </View>
  );
}

/** Round icon-only button. Always pass accessibilityLabel. */
export function IconButton({
  children,
  accessibilityLabel,
  ...rest
}: Omit<PressableProps, "children"> & { children: React.ReactNode; accessibilityLabel: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderColor: colors.border },
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

/** Uppercase label + big value + caption — the status tiles on Home. */
export function StatTile({ label, value, caption, highlight }: { label: string; value: string; caption?: string; highlight?: boolean }) {
  return (
    <Card highlight={highlight} style={styles.stat}>
      <Text variant="overline" tone="muted" numberOfLines={1}>{label}</Text>
      <Text variant="metric" tone={highlight ? "level" : "default"} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 18 }}>
        {value}
      </Text>
      {caption ? <Text variant="small" tone="muted" style={{ fontSize: 12, lineHeight: 16 }} numberOfLines={2}>{caption}</Text> : null}
    </Card>
  );
}

/** Pill toggle used for filters and option rows (time limit, theme). */
/** disabled: faded, dashed border, can't be tapped (e.g. paid time ≤ the reminder lead time, mockup Z1). */
export function Pill({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.pill,
        selected
          ? { backgroundColor: colors.text, borderColor: colors.text }
          : { backgroundColor: "transparent", borderColor: colors.border },
        disabled && { borderStyle: "dashed", opacity: 0.45 },
      ]}
    >
      <Text variant="smallStrong" style={{ color: selected ? colors.background : colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg },
  tag: { borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stat: { flex: 1, padding: spacing.md, borderRadius: radius.lg, gap: 2 },
  pill: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
