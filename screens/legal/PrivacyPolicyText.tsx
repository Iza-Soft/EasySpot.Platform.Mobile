import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { spacing } from "../../theme/tokens";
import { Text } from "../../ui";

const SECTIONS = ["collect", "location", "storage", "services", "reminders", "sharing", "rights", "changes", "contact"] as const;

/** The full privacy policy (mockup L2), in the phone's language. Used at first start and from Settings. */
export function PrivacyPolicyText() {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text variant="title" accessibilityRole="header">{t("v2.privacy.title")}</Text>
      <Text variant="small" tone="muted">{t("v2.privacy.effective")}</Text>
      {SECTIONS.map((s) => (
        <View key={s} style={styles.section}>
          <Text variant="overline" tone="level" accessibilityRole="header">{t(`v2.privacy.s_${s}_h`)}</Text>
          <Text variant="body" tone="secondary" selectable style={styles.body}>{t(`v2.privacy.s_${s}`)}</Text>
        </View>
      ))}
      <Text variant="small" tone="muted" style={styles.footer}>
        © {new Date().getFullYear()} EasySpot — Ilko Adamov
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  section: { gap: spacing.xs, marginTop: spacing.lg },
  body: { lineHeight: 23 },
  footer: { marginTop: spacing.xxl, textAlign: "center" },
});
