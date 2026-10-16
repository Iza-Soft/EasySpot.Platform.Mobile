import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { formatClock } from "../domain/time";
import { fixStep, useReminderReadiness, warningKey } from "../state/remindersStore";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing } from "../theme/tokens";
import { Text } from "./Text";

/**
 * Paid time set, but the phone will hold the reminder back (mockups X1/X2):
 *  notifications off → "no reminder at 14:03 · Turn on" (wins — nothing would arrive);
 *  exact alarms off  → "the 14:03 reminder may come up to 15 min late · Allow exact time".
 * Renders nothing when the reminder will arrive on time.
 */
export function ReminderWarning({ remindAt, prefix }: { remindAt: number; prefix?: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const key = warningKey(useReminderReadiness());
  if (!key) return null;

  const time = formatClock(remindAt);
  const text = key === "notifications" ? t("v2.reminders.warn_notif", { time }) : t("v2.reminders.warn_exact", { time });
  const button = key === "notifications" ? t("v2.reminders.warn_turn_on") : t("v2.reminders.warn_allow");
  return (
    <View
      style={[styles.box, { borderColor: colors.alert, backgroundColor: colors.alert + "1A" }]}
      accessibilityRole="alert"
    >
      <Ionicons
        name={key === "notifications" ? "notifications-off-outline" : "alarm-outline"}
        size={16}
        color={colors.alert}
        style={{ marginTop: 2 }}
      />
      <Text variant="small" style={{ flex: 1 }}>
        {prefix ? `${prefix} · ` : ""}
        {text}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => fixStep(key)}
        style={({ pressed }) => [styles.btn, { backgroundColor: colors.alert }, pressed && { opacity: 0.85 }]}
      >
        <Text variant="smallStrong" style={{ color: colors.onAlert }}>{button}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  btn: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
});
