import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Pressable, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { dayBucket, formatClock, formatDayMonth } from "../../domain/time";
import { sendTestReminder } from "../../platform/timer";
import { clearReminderLog, getReminderLog, isLate, LogEntry } from "../../services/reminder-log";
import { confirmLaunchStep, fixStep, ReminderStep, useReminderReadiness } from "../../state/remindersStore";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/tokens";
import { Button, Card, Text } from "../../ui";
import { InfoLayout } from "../info/InfoLayout";

const TEST_SECONDS = 15;

const ICONS: Record<ReminderStep["key"], keyof typeof Ionicons.glyphMap> = {
  notifications: "notifications-outline",
  exactAlarms: "alarm-outline",
  battery: "battery-charging-outline",
  launch: "rocket-outline",
};

/** Reminders setup (mockups W2/W3): what may stop the "paid time ends" reminder, each with Fix. */
export default function RemindersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const r = useReminderReadiness();
  const [testing, setTesting] = useState(false);
  const [log, setLog] = useState<LogEntry[] | null>(null);

  // History (W4): on open, when coming back to the app, and every 5 s while on screen
  // (so a test reminder shows up here right after it arrives).
  const loadLog = useCallback(() => {
    getReminderLog().then(setLog).catch(() => setLog([]));
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadLog();
      const timer = setInterval(loadLog, 5_000);
      return () => clearInterval(timer);
    }, [loadLog]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (st) => st === "active" && loadLog());
    return () => sub.remove();
  }, [loadLog]);

  const oem = r.oem ?? "huawei";
  const title = (s: ReminderStep) => (s.key === "launch" ? t(`v2.reminders.launch_title_${oem}`) : t(`v2.reminders.${s.key}_title`));
  const subtitle = (s: ReminderStep) => {
    if (s.key === "launch") return s.ok ? t("v2.reminders.launch_ok") : t(`v2.reminders.launch_sub_${oem}`);
    return t(`v2.reminders.${s.key}_${s.ok ? "ok" : "off"}`);
  };

  const test = async () => {
    setTesting(true);
    const ok = await sendTestReminder(TEST_SECONDS, t("v2.reminders.test_title"), t("v2.reminders.test_body")).catch(() => false);
    setTesting(false);
    Toast.show(ok ? { type: "success", text1: t("v2.reminders.test_sent") } : { type: "error", text1: t("v2.reminders.test_failed") });
  };

  const pct = r.total ? (r.done / r.total) * 100 : 100;

  return (
    <InfoLayout screen={t("v2.reminders.screen")}>
      <View style={styles.head}>
        <Text variant="heading" accessibilityRole="header">{t("v2.reminders.title")}</Text>
        <Text variant="body" tone="muted">{t("v2.reminders.lead")}</Text>
      </View>

      {r.loaded ? (
        <View style={styles.progress} accessibilityLabel={t("v2.reminders.progress", { done: r.done, total: r.total })}>
          <View style={styles.progressText}>
            <Text variant="smallStrong">{t("v2.reminders.progress", { done: r.done, total: r.total })}</Text>
            <Text variant="small" tone="muted">{t("v2.reminders.recheck")}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: r.ready ? colors.accentFg : colors.alert }]} />
          </View>
        </View>
      ) : null}

      <Card style={styles.list}>
        {r.steps.map((s, i) => (
          <View key={s.key} style={[styles.step, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.stepRow}>
              <View style={[styles.icon, { backgroundColor: colors.surfaceRaised }]}>
                <Ionicons name={ICONS[s.key]} size={18} color={s.ok ? colors.accentFg : colors.alert} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{title(s)}</Text>
                <Text variant="small" tone="muted">{subtitle(s)}</Text>
                {!s.ok && s.key === "battery" ? (
                  <Text variant="small" tone="secondary">{t(`v2.reminders.battery_hint_${r.batteryPage}`)}</Text>
                ) : null}
              </View>
              {s.ok ? (
                <View style={[styles.ready, { backgroundColor: colors.surfaceRaised }]}>
                  <Ionicons name="checkmark" size={14} color={colors.accentFg} />
                  <Text variant="smallStrong" tone="accent">{t("v2.reminders.ready")}</Text>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t(s.manual ? "v2.reminders.open" : "v2.reminders.fix")} — ${title(s)}`}
                  onPress={() => fixStep(s.key)}
                  style={({ pressed }) => [
                    styles.fix,
                    s.manual
                      ? { borderWidth: 1, borderColor: colors.alert }
                      : { backgroundColor: colors.alert },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text variant="smallStrong" style={{ color: s.manual ? colors.alert : colors.onAlert }}>
                    {t(s.manual ? "v2.reminders.open" : "v2.reminders.fix")}
                  </Text>
                </Pressable>
              )}
            </View>

            {s.manual && !s.ok ? (
              <View style={styles.mini}>
                {(oem === "huawei"
                  ? ["launch_step1_huawei", "launch_step2_huawei", "launch_step_back"]
                  : ["launch_step1_xiaomi", "launch_step_back"]
                ).map((k, n) => (
                  <View key={k} style={styles.miniRow}>
                    <View style={[styles.num, { backgroundColor: colors.surfaceRaised }]}>
                      <Text variant="smallStrong" tone="alert" style={{ fontSize: 11 }}>{n + 1}</Text>
                    </View>
                    <Text variant="small" tone="secondary" style={{ flex: 1 }}>{t(`v2.reminders.${k}`)}</Text>
                  </View>
                ))}
                {oem === "huawei" ? (
                  <Text variant="small" tone="muted" style={{ marginLeft: 28 }}>{t("v2.reminders.launch_note_battery")}</Text>
                ) : null}
                <Button label={t("v2.reminders.did_it")} onPress={confirmLaunchStep} style={styles.didIt} />
              </View>
            ) : null}
          </View>
        ))}
      </Card>

      <Button
        label={t("v2.reminders.test")}
        loading={testing}
        icon={<Ionicons name="notifications-outline" size={18} color={colors.accentFg} />}
        onPress={test}
        style={{ marginTop: spacing.lg }}
      />
      <Text variant="small" tone="muted" style={styles.testHint}>{t("v2.reminders.test_hint", { n: TEST_SECONDS })}</Text>

      <View style={styles.logHead}>
        <Text variant="overline" tone="muted" accessibilityRole="header" style={{ flex: 1 }}>{t("v2.reminders.log_title")}</Text>
        {log && log.length ? (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => clearReminderLog().then(loadLog)}>
            <Text variant="smallStrong" tone="muted">{t("v2.reminders.log_clear")}</Text>
          </Pressable>
        ) : null}
      </View>
      {log && log.length ? (
        <>
          <Text variant="small" tone="secondary">
            {t("v2.reminders.log_summary", { ok: log.filter((e) => !isLate(e)).length, total: log.length })}
          </Text>
          <Card style={[styles.list, { marginTop: spacing.sm }]}>
            {log.map((e, i) => (
              <LogRow key={e.key} e={e} divider={i > 0} />
            ))}
          </Card>
          <Text variant="small" tone="muted" style={{ marginTop: spacing.sm }}>{t("v2.reminders.log_note")}</Text>
        </>
      ) : log ? (
        <Text variant="small" tone="muted">{t("v2.reminders.log_empty")}</Text>
      ) : null}

    </InfoLayout>
  );
}

/** One delivered reminder: name, due vs. came, phone state, On time / Late +7 min. */
function LogRow({ e, divider }: { e: LogEntry; divider: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const late = isLate(e);
  const clock = (ms: number) => (e.test ? new Date(ms).toTimeString().slice(0, 8) : formatClock(ms));
  const bucket = dayBucket(e.cameAt);
  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  const day =
    bucket === "today"
      ? t("v2.reminders.today")
      : e.cameAt >= yesterday.getTime() - 86_400_000
        ? t("v2.reminders.yesterday")
        : formatDayMonth(e.cameAt);
  const state =
    e.screenOff === undefined
      ? null
      : [
          e.screenOff ? t("v2.reminders.st_screen_off") : t("v2.reminders.st_in_use"),
          e.locked && e.screenOff ? t("v2.reminders.st_locked") : null,
          e.idle ? t("v2.reminders.st_idle") : null,
          e.powerSave ? t("v2.reminders.st_saver") : null,
        ]
          .filter(Boolean)
          .join(" · ");
  const lateMin = Math.max(1, Math.round((e.cameAt - e.plannedAt) / 60_000));
  return (
    <View style={[styles.logRow, divider && { borderTopWidth: 1, borderTopColor: colors.border }]}>
      <View style={[styles.logIcon, { backgroundColor: colors.surfaceRaised }]}>
        <Ionicons name={e.test ? "notifications-outline" : "location-outline"} size={16} color={late ? colors.alert : colors.accentFg} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="smallStrong" numberOfLines={1}>{e.test ? t("v2.reminders.test_name") : e.title || t("v2.parked.title")}</Text>
        <Text variant="small" tone="muted" style={styles.tabular}>
          {t("v2.reminders.log_line", { day, planned: clock(e.plannedAt), came: clock(e.cameAt) })}
        </Text>
        {state ? <Text variant="small" tone="muted" style={{ fontSize: 12 }}>{state}</Text> : null}
      </View>
      <View style={[styles.logChip, { backgroundColor: late ? colors.alert + "26" : colors.surfaceRaised }]}>
        <Text variant="smallStrong" style={{ fontSize: 12, color: late ? colors.alert : colors.accentFg }}>
          {late ? t("v2.reminders.late", { d: lateMin }) : t("v2.reminders.on_time")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logHead: { flexDirection: "row", alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.xs },
  logRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  logIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  logChip: { height: 26, paddingHorizontal: 10, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  tabular: { fontVariant: ["tabular-nums"] },
  head: { gap: spacing.xs },
  progress: { gap: spacing.xs, marginTop: spacing.lg },
  progressText: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  track: { height: 8, borderRadius: radius.pill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
  list: { padding: 0, overflow: "hidden", marginTop: spacing.lg },
  step: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ready: { flexDirection: "row", alignItems: "center", gap: 4, height: 32, paddingHorizontal: 12, borderRadius: radius.pill },
  fix: { minHeight: 44, minWidth: 64, paddingHorizontal: 16, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  mini: { marginLeft: 48, gap: 6 },
  miniRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  num: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  didIt: { alignSelf: "flex-start", marginTop: 4 },
  testHint: { textAlign: "center", marginTop: spacing.xs },
});
