import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { deviceLanguage, SUPPORTED_LANGUAGES } from "../../i18n";
import { setPref, usePrefs } from "../../state/prefs";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing, touchTarget } from "../../theme/tokens";
import { Card, Text } from "../../ui";
import { InfoLayout } from "./InfoLayout";

/** Each language in its own name, and in English for people who can't read the script. */
export const LANGUAGE_NAMES: Record<string, { own: string; en: string }> = {
  en: { own: "English", en: "English" },
  bg: { own: "Български", en: "Bulgarian" },
  ru: { own: "Русский", en: "Russian" },
  de: { own: "Deutsch", en: "German" },
  fr: { own: "Français", en: "French" },
  tr: { own: "Türkçe", en: "Turkish" },
  es: { own: "Español", en: "Spanish" },
  it: { own: "Italiano", en: "Italian" },
  ro: { own: "Română", en: "Romanian" },
};

/**
 * In-app language picker (mockup U3) — replaces the system page, which the
 * app can't theme. "Like the phone" is the default; a pick switches at once.
 */
export default function LanguageScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = usePrefs();
  const phone = LANGUAGE_NAMES[deviceLanguage()]?.own ?? "English";

  const options: { code: string; title: string; sub?: string }[] = [
    { code: "system", title: t("v2.language.follow"), sub: t("v2.language.follow_now", { lang: phone }) },
    ...SUPPORTED_LANGUAGES.map((c) => ({
      code: c,
      title: LANGUAGE_NAMES[c].own,
      sub: LANGUAGE_NAMES[c].own !== LANGUAGE_NAMES[c].en ? LANGUAGE_NAMES[c].en : undefined,
    })),
  ];

  return (
    <InfoLayout screen={t("v2.language.screen")}>
      <Text variant="title" accessibilityRole="header">{t("v2.language.title")}</Text>
      <Text variant="small" tone="muted">{t("v2.language.sub")}</Text>
      <Card style={styles.list}>
        {options.map((o, i) => {
          const on = (language || "system") === o.code;
          return (
            <Pressable
              key={o.code}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setPref("language", o.code)}
              style={({ pressed }) => [
                styles.row,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                pressed && { backgroundColor: colors.surfaceRaised },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{o.title}</Text>
                {o.sub ? <Text variant="small" tone="muted">{o.sub}</Text> : null}
              </View>
              <View style={[styles.radio, { borderColor: on ? colors.accentFg : colors.textMuted }]}>
                {on ? <View style={[styles.dot, { backgroundColor: colors.accentFg }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </Card>
    </InfoLayout>
  );
}

const styles = StyleSheet.create({
  list: { padding: 0, borderRadius: radius.xl, overflow: "hidden", marginTop: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: touchTarget + 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
