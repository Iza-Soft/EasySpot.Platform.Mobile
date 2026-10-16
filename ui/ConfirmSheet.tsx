import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing } from "../theme/tokens";
import { Button } from "./Button";
import { Text } from "./Text";

/**
 * Confirmation as a bottom sheet (replaces the system Alert).
 * Destructive = Flare icon + Flare confirm button. `preview` shows what is
 * affected (e.g. the spot row) so the user sees exactly what will go.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  preview,
  confirmLabel,
  cancelLabel,
  icon = "trash-outline",
  destructive = true,
  busy,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  preview?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tint = destructive ? colors.alert : colors.accentFg;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={cancelLabel} />
      <View
        accessibilityViewIsModal
        style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />

        <View style={styles.head}>
          <View style={[styles.iconCircle, { backgroundColor: tint + "24" }]}>
            <Ionicons name={icon} size={28} color={tint} />
          </View>
          <Text variant="title" style={styles.center} accessibilityRole="header">{title}</Text>
          {message ? <Text variant="body" tone="muted" style={styles.center}>{message}</Text> : null}
        </View>

        {preview ? <View style={[styles.preview, { backgroundColor: colors.surfaceRaised }]}>{preview}</View> : null}

        <View style={styles.buttons}>
          <Button
            kind={destructive ? "danger" : "primary"}
            size="lg"
            label={confirmLabel}
            loading={busy}
            icon={<Ionicons name={icon} size={18} color={destructive ? colors.onAlert : colors.onAccent} />}
            onPress={onConfirm}
          />
          <Button label={cancelLabel} onPress={onCancel} disabled={busy} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3 },
  head: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xs },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
  preview: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.lg },
  buttons: { gap: spacing.sm, marginTop: spacing.xs },
});
