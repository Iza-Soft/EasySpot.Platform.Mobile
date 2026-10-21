import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, PressableProps, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, touchTarget } from "../theme/tokens";
import { FONT_CAP, useCompact } from "./responsive";
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
      <Text variant="smallStrong" numberOfLines={1} style={{ flexShrink: 1 }}>{label}</Text>
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

/**
 * Uppercase label + big value + caption — the status tiles on Home.
 * Three tiles share one row, so their text keeps a fixed size (FONT_CAP.FIXED)
 * and shrinks to fit; a word that still can't fit is hyphenated, never cut.
 */
export function StatTile({ label, value, caption, highlight }: { label: string; value: string; caption?: string; highlight?: boolean }) {
  const compact = useCompact();
  return (
    <Card highlight={highlight} style={[styles.stat, compact && styles.statCompact]}>
      <Text
        variant="overline"
        tone="muted"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={compact ? { letterSpacing: 0.8 } : undefined}
      >
        {label}
      </Text>
      <Text
        variant="metric"
        tone={highlight ? "level" : "default"}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontSize: compact ? 16 : 18 }}
      >
        {value}
      </Text>
      {caption ? (
        <Text
          variant="small"
          tone="muted"
          maxFontSizeMultiplier={FONT_CAP.FIXED}
          android_hyphenationFrequency="normal"
          textBreakStrategy="balanced"
          style={{ fontSize: compact ? 11 : 12, lineHeight: compact ? 14 : 16 }}
          numberOfLines={2}
        >
          {caption}
        </Text>
      ) : null}
    </Card>
  );
}

/** Pill toggle used for filters and option rows (time limit, theme). */
/** disabled: faded, dashed border, can't be tapped (e.g. paid time ≤ the reminder lead time, mockup Z1). */
export function Pill({
  label,
  selected,
  disabled,
  compact,
  chevron,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  /** Tighter padding — a row of 5 that has to fit one line (Paid time). */
  compact?: boolean;
  /** "▾" after the label: the pill opens a picker. */
  chevron?: boolean;
  accessibilityLabel?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const fg = selected ? colors.background : colors.textSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.pill,
        compact && { paddingHorizontal: spacing.sm + 2 },
        selected
          ? { backgroundColor: colors.text, borderColor: colors.text }
          : { backgroundColor: "transparent", borderColor: colors.border },
        disabled && { borderStyle: "dashed", opacity: 0.45 },
      ]}
    >
      <View style={styles.pillRow}>
        <Text variant="smallStrong" style={{ color: fg, flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {label}
        </Text>
        {chevron ? <Ionicons name="chevron-down" size={14} color={fg} /> : null}
      </View>
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
  stat: { flex: 1, minWidth: 0, padding: spacing.md, borderRadius: radius.lg, gap: 2 },
  statCompact: { paddingHorizontal: 10, paddingVertical: 10 },
  pillRow: { flexDirection: "row", alignItems: "center", gap: 3, maxWidth: "100%" },
  pill: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
