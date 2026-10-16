import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/tokens";
import { Button, IconButton, Logo, Text } from "../../ui";
import { PrivacyPolicyText } from "./PrivacyPolicyText";

const POINTS: {
  key: "p1" | "p2" | "p3" | "p4";
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "p1", icon: "location-outline" },
  { key: "p2", icon: "phone-portrait-outline" },
  { key: "p3", icon: "ban-outline" },
  { key: "p4", icon: "map-outline" },
];

/**
 * First start (mockups L1 + L2), shown INSTEAD of the app until accepted
 * (Home is not even mounted). A full screen in the app's design — four
 * plain-language points, the full policy one tap away, "I agree" + Continue.
 * Continue stays disabled until the box is ticked.
 */
export function PrivacyConsent({ onAccept }: { onAccept: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);
  const [full, setFull] = useState(false);

  // Android back: from the full text back to the summary (otherwise the system default — leave the app).
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!full) return false;
      setFull(false);
      return true;
    });
    return () => sub.remove();
  }, [full]);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {full ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + spacing.lg,
              paddingBottom: insets.bottom + spacing.xxl,
            },
          ]}
        >
          <View style={styles.fullHeader}>
            <IconButton
              accessibilityLabel={t("v2.common.back")}
              onPress={() => setFull(false)}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </IconButton>
            <Text
              variant="action"
              tone="muted"
              style={styles.headerTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t("v2.privacy.screen").toLocaleUpperCase()}
            </Text>
          </View>
          <PrivacyPolicyText />
        </ScrollView>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingTop: insets.top + spacing.xxl },
            ]}
          >
            <Logo size={56} />
            <Text
              variant="title"
              accessibilityRole="header"
              style={styles.title}
            >
              {t("v2.privacy.consent_title")}
            </Text>
            <Text variant="body" tone="muted">
              {t("v2.privacy.consent_sub")}
            </Text>
            <View style={styles.points}>
              {POINTS.map((p) => (
                <View
                  key={p.key}
                  style={[
                    styles.point,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pointIcon,
                      { backgroundColor: colors.surfaceRaised },
                    ]}
                  >
                    <Ionicons name={p.icon} size={18} color={colors.accentFg} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">
                      {t(`v2.privacy.${p.key}_title`)}
                    </Text>
                    <Text variant="small" tone="muted">
                      {t(`v2.privacy.${p.key}_text`)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => setFull(true)}
              hitSlop={6}
              style={styles.readFull}
            >
              <Text variant="bodyStrong" tone="accent">
                {t("v2.privacy.read_full")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.accentFg}
              />
            </Pressable>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.navBar,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + spacing.lg,
              },
            ]}
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              onPress={() => setAgreed((v) => !v)}
              style={styles.agree}
            >
              <View
                style={[
                  styles.box,
                  agreed
                    ? {
                        backgroundColor: colors.accent,
                        borderColor: colors.accentFg,
                      }
                    : { borderColor: colors.textMuted },
                ]}
              >
                {agreed ? (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.onAccent}
                  />
                ) : null}
              </View>
              <Text variant="body" style={{ flex: 1 }}>
                {t("v2.privacy.agree")}
              </Text>
            </Pressable>
            <Button
              kind="primary"
              size="lg"
              label={t("v2.privacy.cont")}
              disabled={!agreed}
              onPress={onAccept}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: { marginTop: spacing.sm, fontSize: 26, lineHeight: 32 },
  points: { gap: spacing.sm, marginTop: spacing.xs },
  point: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pointIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  readFull: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  agree: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 44,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  fullHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerTitle: { flex: 1, textAlign: "right", letterSpacing: 1.5 },
});
