import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React from "react";
import { useTranslation } from "react-i18next";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/tokens";
import { Logo, Text } from "../../ui";
import { InfoLayout } from "./InfoLayout";

const FEATURES: { key: "f1" | "f2" | "f3" | "f4"; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "f1", icon: "location-outline" },
  { key: "f2", icon: "notifications-outline" },
  { key: "f3", icon: "star-outline" },
  { key: "f4", icon: "phone-portrait-outline" },
];

const PACKAGE = "com.ilkoadamov.easyspot";

/** Store page for "Rate EasySpot": Google Play or AppGallery (decided at build time). null on iOS until it is published. */
function storeLinks(): { app: string; web: string } | null {
  if (Platform.OS !== "android") return null;
  const store = Constants.expoConfig?.extra?.store;
  if (store === "appgallery") return { app: `appmarket://details?id=${PACKAGE}`, web: `https://appgallery.huawei.com/` };
  return { app: `market://details?id=${PACKAGE}`, web: `https://play.google.com/store/apps/details?id=${PACKAGE}` };
}

/** Settings → About EasySpot (mockup U2). */
export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? "";
  const build = Platform.OS === "android" ? String(Constants.expoConfig?.android?.versionCode ?? "") : Constants.expoConfig?.ios?.buildNumber ?? "";
  const links = storeLinks();

  const rate = async () => {
    if (!links) return;
    try {
      await Linking.openURL(links.app);
    } catch {
      Linking.openURL(links.web).catch(() => undefined);
    }
  };

  return (
    <InfoLayout screen={t("v2.about.screen")}>
      <View style={styles.hero}>
        <Logo size={64} />
        <Text variant="action" style={styles.name}>EASYSPOT</Text>
        <Text variant="body" tone="muted" style={{ textAlign: "center" }}>{t("v2.about.tagline")}</Text>
        <View style={[styles.version, { borderColor: colors.border }]}>
          <Text variant="smallStrong" tone="muted" style={{ fontSize: 12 }}>{t("v2.about.version", { version, build })}</Text>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        {FEATURES.map((f) => (
          <View key={f.key} style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: colors.surfaceRaised }]}>
              <Ionicons name={f.icon} size={18} color={colors.level} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{t(`v2.about.${f.key}_t`)}</Text>
              <Text variant="small" tone="muted">{t(`v2.about.${f.key}_d`)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        {links ? (
          <Pressable accessibilityRole="link" onPress={rate} hitSlop={8} style={styles.rate}>
            <Ionicons name="star" size={16} color={colors.level} />
            <Text variant="bodyStrong" tone="level">{t("v2.about.rate")}</Text>
          </Pressable>
        ) : null}
        <Text variant="small" tone="muted" selectable>ilko.z.adamov@gmail.com</Text>
        <Text variant="small" tone="muted">{t("v2.about.copyright", { year: new Date().getFullYear() })}</Text>
      </View>
    </InfoLayout>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
  name: { fontSize: 22, letterSpacing: 1, marginTop: spacing.xs },
  version: { height: 26, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, justifyContent: "center" },
  feature: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start", padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  footer: { alignItems: "center", gap: 4, marginTop: spacing.xl },
  rate: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
});
