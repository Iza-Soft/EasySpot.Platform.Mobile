import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, touchTarget } from "../theme/tokens";
import { Text } from "./Text";

export interface SheetAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
}

/** Bottom action list (replaces Alert menus, which Android caps at 3 buttons). */
export function ActionSheet({
  visible,
  title,
  subtitle,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  subtitle?: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        {title ? (
          <View style={styles.header}>
            <Text variant="bodyStrong" numberOfLines={1}>{title}</Text>
            {subtitle ? <Text variant="small" tone="muted" numberOfLines={2}>{subtitle}</Text> : null}
          </View>
        ) : null}
        {actions.map((a) => (
          <Pressable
            key={a.key}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              a.onPress();
            }}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceRaised }]}
          >
            <Ionicons name={a.icon} size={22} color={a.destructive ? colors.alert : colors.text} />
            <Text variant="body" style={a.destructive ? { color: colors.alert } : undefined}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingTop: spacing.sm },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, marginBottom: spacing.sm },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: 2 },
  row: {
    minHeight: touchTarget + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});
