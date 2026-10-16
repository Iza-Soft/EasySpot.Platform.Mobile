import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { IconButton, Text } from "../../ui";
import { Screen } from "../../ui/Screen";

/**
 * Shared frame of the info screens (mockups U1–U5): back button, the screen
 * name top-right in the header type, themed background (follows Appearance).
 */
export function InfoLayout({ screen, children }: { screen: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  return (
    <Screen>
      <View style={styles.header}>
        <IconButton accessibilityLabel={t("v2.common.back")} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </IconButton>
        <Text variant="action" tone="muted" numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
          {screen.toLocaleUpperCase()}
        </Text>
      </View>
      {children}
    </Screen>
  );
}

/** A section of a legal text: small header (Volt on dark, ink on light) + body. */
export function InfoSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="level" accessibilityRole="header">{title}</Text>
      <Text variant="body" tone="secondary" selectable style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  title: { flex: 1, textAlign: "right", letterSpacing: 1.5 },
  section: { gap: spacing.xs, marginTop: spacing.lg },
  body: { lineHeight: 23 },
});
