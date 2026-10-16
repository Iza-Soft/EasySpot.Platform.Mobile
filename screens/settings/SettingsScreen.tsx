import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import Constants from "expo-constants";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { MapApp, MapChoice, resolveMap } from "../../constants/maps";

import { getEcosystem } from "../../platform/services";
import { getPhoneMapsAsync } from "../../services/map-apps";
import { getSavedMap, setPreferredMap } from "../../services/map-preference-service";
import { REMIND_BEFORE_OPTIONS, setPref, usePrefs } from "../../state/prefs";
import { useReminderReadiness } from "../../state/remindersStore";
import { ThemePreference, useTheme } from "../../theme/ThemeProvider";
import { radius, spacing, touchTarget } from "../../theme/tokens";
import { ActionSheet, AppHeader, Card, Pill, Text } from "../../ui";
import { Screen } from "../../ui/Screen";
import { LANGUAGE_NAMES } from "../info/LanguageScreen";

/** Settings (mockup T1). */
export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { name: themeName, colors, preference, setPreference } = useTheme();
  const prefs = usePrefs();
  const [map, setMap] = useState<MapChoice | null>(null);
  const [mapApps, setMapApps] = useState<MapApp[]>([]);
  const [remindPicker, setRemindPicker] = useState(false);
  const reminders = useReminderReadiness();
  const version = Constants.expoConfig?.version ?? "";
  const build = Platform.OS === "android" ? String(Constants.expoConfig?.android?.versionCode ?? "") : Constants.expoConfig?.ios?.buildNumber ?? "";

  // Installed map apps (only those — the list follows what is on the phone):
  // on focus and when coming back to the app (e.g. after installing a new map app).
  const refreshDevice = useCallback(() => {
    let alive = true;
    Promise.all([getPhoneMapsAsync(), getSavedMap()]).then(([{ apps, isHuawei }, saved]) => {
      if (!alive) return;
      const chosen = resolveMap(saved, apps, isHuawei);
      // The chosen app was uninstalled (or nothing chosen yet) → the phone's main map.
      if (chosen !== saved) setPreferredMap(chosen).catch(() => {});
      setMapApps(apps);
      setMap(chosen);
    });
    return () => {
      alive = false;
    };
  }, []);
  useFocusEffect(refreshDevice);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => s === "active" && refreshDevice());
    return () => sub.remove();
  }, [refreshDevice]);


  const themes: { key: ThemePreference; label: string }[] = [
    { key: "dark", label: t("v2.settings.theme_dark") },
    { key: "light", label: t("v2.settings.theme_light") },
    { key: "system", label: t("v2.settings.theme_system") },
  ];


  return (
    <Screen>
      <AppHeader title={t("v2.tabs.settings")} />

      <Section title={t("v2.settings.appearance")}>
        <View style={styles.pills}>
          {themes.map((th) => (
            <Pill key={th.key} label={th.label} selected={preference === th.key} onPress={() => setPreference(th.key)} />
          ))}
        </View>
        {preference === "system" ? (
          <Text variant="small" tone="muted">
            {t("v2.settings.theme_system_hint", {
              mode: (themeName === "dark" ? t("v2.settings.theme_dark") : t("v2.settings.theme_light")).toLocaleLowerCase(),
            })}
          </Text>
        ) : null}
      </Section>

      <Section title={t("v2.settings.maps")} hint={t("v2.settings.maps_hint")}>
        <Card style={styles.list}>
          {mapApps.map((p, i) => {
            const selected = map === p.id;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setMap(p.id);
                  setPreferredMap(p.id);
                }}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  pressed && { backgroundColor: colors.surfaceRaised },
                ]}
              >
                {p.icon ? (
                  <Image source={{ uri: p.icon }} style={styles.appIcon} accessibilityIgnoresInvertColors />
                ) : (
                  <View style={[styles.appIcon, { backgroundColor: p.brandColor }]}>
                    <Text variant="smallStrong" style={{ color: "#fff", fontSize: p.initial.length > 1 ? 11 : 14 }}>{p.initial}</Text>
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{p.label}</Text>
                  {p.webOnly ? <Text variant="small" tone="muted">{t("v2.settings.web_only")}</Text> : null}
                </View>
                <Radio on={selected} />
              </Pressable>
            );
          })}
        </Card>
      </Section>

      <Section title={t("v2.settings.parking")}>
        <Card style={styles.list}>
          <View style={styles.row}>
            <IconBox name="business-outline" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{t("v2.settings.level_labels")}</Text>
              <Text variant="small" tone="muted">{t("v2.settings.level_labels_hint")}</Text>
            </View>
            <View style={styles.segment}>
              <Pill label="B2" selected={prefs.levelLabels === "letter"} onPress={() => setPref("levelLabels", "letter")} />
              <Pill label="−2" selected={prefs.levelLabels === "signed"} onPress={() => setPref("levelLabels", "signed")} />
            </View>
          </View>
          <LinkRow
            icon="notifications-outline"
            label={t("v2.settings.remind_before")}
            value={t("v2.settings.minutes", { n: prefs.remindBeforeMin })}
            onPress={() => setRemindPicker(true)}
            divider
          />
        </Card>
      </Section>

      <Section title={t("v2.settings.reliability")}>
        <Card style={styles.list}>
          <LinkRow
            icon="notifications-outline"
            label={t("v2.reminders.settings_row")}
            hint={t("v2.reminders.settings_hint")}
            chip={
              reminders.loaded
                ? reminders.ready
                  ? { text: t("v2.reminders.ready"), color: colors.accentFg }
                  : { text: `${reminders.done}/${reminders.total}`, color: colors.alert }
                : undefined
            }
            onPress={() => navigation.navigate("Reminders")}
          />
        </Card>
      </Section>

      <Section title={t("v2.settings.language")}>
        <Card style={styles.list}>
          <LinkRow
            icon="globe-outline"
            label={LANGUAGE_NAMES[i18n.language]?.own ?? i18n.language}
            hint={prefs.language === "system" ? t("v2.language.follow") : undefined}
            value={t("v2.settings.change")}
            onPress={() => navigation.navigate("Language")}
          />
        </Card>
      </Section>

      <Section title={t("v2.settings.legal")}>
        <Card style={styles.list}>
          <LinkRow icon="shield-checkmark-outline" label={t("v2.settings.privacy")} onPress={() => navigation.navigate("Privacy")} />
          <LinkRow icon="document-text-outline" label={t("v2.settings.terms")} onPress={() => navigation.navigate("Terms")} divider />
          <LinkRow icon="information-circle-outline" label={t("v2.settings.about")} onPress={() => navigation.navigate("About")} divider />
        </Card>
      </Section>

      <View style={styles.footer}>
        <Text variant="small" tone="muted">{t("v2.settings.version_code", { version, build })}</Text>
        <Text variant="small" tone="muted">{t("v2.settings.engine", { eco: t(`v2.eco.${getEcosystem()}`) })}</Text>
      </View>

      <ActionSheet
        visible={remindPicker}
        title={t("v2.settings.remind_before")}
        actions={REMIND_BEFORE_OPTIONS.map((n) => ({
          key: String(n),
          label: t("v2.settings.minutes", { n }),
          icon: prefs.remindBeforeMin === n ? "checkmark-circle" : "ellipse-outline",
          onPress: () => setPref("remindBeforeMin", n),
        }))}
        onClose={() => setRemindPicker(false)}
      />
    </Screen>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={{ gap: 2 }}>
        <Text variant="overline" tone="muted">{title}</Text>
        {hint ? <Text variant="small" tone="muted">{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function IconBox({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.iconBox, { backgroundColor: colors.surfaceRaised }]}>
      <Ionicons name={name} size={18} color={colors.accentFg} />
    </View>
  );
}

function Radio({ on }: { on: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.radio, { borderColor: on ? colors.accentFg : colors.textMuted }]}>
      {on ? <View style={[styles.radioDot, { backgroundColor: colors.accentFg }]} /> : null}
    </View>
  );
}

function LinkRow({
  icon,
  label,
  hint,
  value,
  chip,
  onPress,
  divider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  value?: string;
  chip?: { text: string; color: string };
  onPress: () => void;
  divider?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        divider && { borderTopWidth: 1, borderTopColor: colors.border },
        pressed && { backgroundColor: colors.surfaceRaised },
      ]}
    >
      <IconBox name={icon} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{label}</Text>
        {hint ? <Text variant="small" tone="muted">{hint}</Text> : null}
        {chip ? (
          <View style={[styles.chip, { borderColor: chip.color }]}>
            <Text variant="smallStrong" style={{ color: chip.color, fontSize: 12, lineHeight: 16 }}>{chip.text}</Text>
          </View>
        ) : null}
      </View>
      {value ? <Text variant="smallStrong" tone="level">{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm, marginBottom: spacing.xl },
  pills: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  segment: { flexDirection: "row", gap: 4 },
  list: { padding: 0, borderRadius: radius.xl, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touchTarget + 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  appIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  chip: { alignSelf: "flex-start", marginTop: 4, height: 24, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1, justifyContent: "center" },
  footer: { alignItems: "center", gap: 2, marginTop: spacing.sm },
});
