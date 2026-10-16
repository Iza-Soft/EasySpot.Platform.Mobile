import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing } from "../theme/tokens";
import { Text } from "./Text";

/**
 * The photo of the spot on the whole screen (mockup F6). In Parking it has
 * Retake / Remove; on Parked and in the details only Close.
 */
export function PhotoViewer({
  uri,
  visible,
  subtitle,
  onClose,
  onRetake,
  onRemove,
}: {
  uri: string | null;
  visible: boolean;
  subtitle?: string;
  onClose: () => void;
  onRetake?: () => void;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={styles.white} accessibilityRole="header">{t("v2.photo.title")}</Text>
            <Text variant="small" style={{ color: "#A3A8B3" }}>{subtitle ?? t("v2.photo.only_here")}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t("common.close")} onPress={onClose} hitSlop={6} style={styles.close}>
            <Ionicons name="close" size={22} color="#F2F3F5" />
          </Pressable>
        </View>
        <View style={styles.imageBox}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} resizeMode="contain" accessibilityLabel={t("v2.photo.title")} />
          ) : null}
        </View>
        {onRetake || onRemove ? (
          <View style={styles.buttons}>
            {onRetake ? (
              <DarkButton icon="camera-outline" iconColor={colors.accent} label={t("v2.photo.retake")} onPress={onRetake} />
            ) : null}
            {onRemove ? <DarkButton icon="trash-outline" iconColor="#F2F3F5" label={t("v2.photo.remove")} onPress={onRemove} /> : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/** Outline button on the black photo screen (same look in light and dark theme). */
function DarkButton({
  icon,
  iconColor,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: "#1A1C22" }]}
    >
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text variant="smallStrong" style={styles.white}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", gap: spacing.md },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl },
  white: { color: "#F2F3F5" },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#24272F", alignItems: "center", justifyContent: "center" },
  imageBox: { flex: 1, marginHorizontal: spacing.xl, borderRadius: radius.xl, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  buttons: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.xl },
  button: {
    flex: 1,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#2E323B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
