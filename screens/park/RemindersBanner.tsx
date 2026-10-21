import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Readiness } from "../../state/remindersStore";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/tokens";
import { Text } from "../../ui";

/**
 * Home (mockup W1): shown only while a phone setting can stop the parking reminder.
 * No "later" — it goes away by itself once everything is ready.
 */
export function RemindersBanner({ readiness, onPress }: { readiness: Readiness; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (!readiness.loaded || readiness.ready) return null;
  const count = readiness.total - readiness.done;
  // Explicit keys: i18n runs with compatibilityJSON v3 (no _one/_other plurals).
  const sub = count === 1 ? t("v2.reminders.banner_sub_one") : t("v2.reminders.banner_sub_other", { count });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("v2.reminders.banner_title")}. ${sub}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.banner,
        { borderColor: colors.alert, backgroundColor: colors.alert + "1F" },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.alert }]}>
        <Ionicons name="notifications-off-outline" size={20} color={colors.onAlert} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="bodyStrong">{t("v2.reminders.banner_title")}</Text>
        <Text variant="small" tone="secondary">{sub}</Text>
      </View>
      <View style={[styles.fix, { backgroundColor: colors.alert }]}>
        <Text variant="smallStrong" maxFontSizeMultiplier={1.05} numberOfLines={1} style={{ color: colors.onAlert }}>
          {t("v2.reminders.fix")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    marginTop: spacing.sm,
  },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fix: { height: 36, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
});
