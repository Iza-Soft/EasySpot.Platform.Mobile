import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatClock, formatEnd } from "../../domain/time";
import { remindBeforeFor } from "../../services/spots-service";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/tokens";
import { Button, Text } from "../../ui";

/** Longest paid time that can be chosen (15 days, decided 15.10). */
export const MAX_LIMIT_DAYS = 15;

const ITEM = 44;
const VISIBLE = 5;
const DAYS = Array.from({ length: MAX_LIMIT_DAYS + 1 }, (_, i) => i);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/**
 * Paid time → "Other" (mockup O2): three wheels like the phone's alarm clock —
 * days (0–15) · hours (0–23) · minutes (00–59), step 1. No keyboard, nothing to mistype.
 */
export function DurationSheet({
  visible,
  initialMinutes,
  minMinutes,
  subtitle,
  onCancel,
  onDone,
}: {
  visible: boolean;
  initialMinutes: number;
  /** Under the title; default "Up to 15 days". On Parked: "Time left from now". */
  subtitle?: string;
  /** Shorter than this can't be chosen (the reminder comes N min before the end). */
  minMinutes: number;
  onCancel: () => void;
  onDone: (minutes: number) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [d, setD] = useState(0);
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);

  useEffect(() => {
    if (!visible) return;
    // Opens at 0 · 0 · 00; a time chosen before opens as it was.
    const start = Math.max(0, initialMinutes);
    setD(Math.min(MAX_LIMIT_DAYS, Math.floor(start / 1440)));
    setH(Math.floor((start % 1440) / 60));
    setM(start % 60);
  }, [visible, initialMinutes]);

  // MAX_LIMIT_DAYS is the most: hours and minutes stop there.
  const total = d >= MAX_LIMIT_DAYS ? MAX_LIMIT_DAYS * 1440 : d * 1440 + h * 60 + m;
  const tooShort = total <= minMinutes;
  const end = Date.now() + total * 60_000;
  const at = end - remindBeforeFor(end) * 60_000;
  const atText = new Date(at).toDateString() === new Date(end).toDateString() ? formatClock(at) : formatEnd(at);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={t("v2.duration.cancel")} />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        <View style={{ gap: 4 }}>
          <Text variant="title" accessibilityRole="header">{t("v2.duration.title")}</Text>
          <Text variant="small" tone="muted">{subtitle ?? t("v2.duration.up_to", { n: MAX_LIMIT_DAYS })}</Text>
        </View>

        <View style={styles.wheels}>
          <View pointerEvents="none" style={[styles.band, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]} />
          <Wheel label={t("v2.duration.days")} values={DAYS} value={d} onChange={setD} />
          <Wheel label={t("v2.duration.hours")} values={HOURS} value={d >= MAX_LIMIT_DAYS ? 0 : h} onChange={setH} disabled={d >= MAX_LIMIT_DAYS} />
          <Wheel
            label={t("v2.duration.minutes")}
            values={MINUTES}
            value={d >= MAX_LIMIT_DAYS ? 0 : m}
            onChange={setM}
            disabled={d >= MAX_LIMIT_DAYS}
            pad
          />
        </View>

        <View style={styles.ends}>
          <Ionicons name="notifications-outline" size={16} color={tooShort ? colors.textMuted : colors.accentFg} />
          <Text variant="small" tone="secondary">
            {tooShort ? t("v2.duration.too_short", { n: minMinutes }) : t("v2.save.ends_remind", { end: formatEnd(end), at: atText })}
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button label={t("v2.duration.cancel")} onPress={onCancel} style={{ flex: 1 }} />
          <Button kind="primary" label={t("v2.duration.done")} disabled={tooShort} onPress={() => onDone(total)} style={{ flex: 1 }} />
        </View>
      </View>
    </Modal>
  );
}

function Wheel({
  label,
  values,
  value,
  onChange,
  disabled,
  pad,
}: {
  label: string;
  values: number[];
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  /** 00, 01 … for minutes. */
  pad?: boolean;
}) {
  const { colors } = useTheme();
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, values.indexOf(value));
  /** Where the wheel is while it moves (for the big / small numbers). */
  const [live, setLive] = useState(index);

  useEffect(() => {
    setLive(index);
    ref.current?.scrollTo({ y: index * ITEM, animated: false });
  }, [index]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.min(values.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM)));
    setLive(i);
    if (values[i] !== value) onChange(values[i]);
  };
  const show = (v: number) => (pad ? String(v).padStart(2, "0") : String(v));
  const step = (dir: 1 | -1) => {
    const i = Math.min(values.length - 1, Math.max(0, index + dir));
    onChange(values[i]);
  };

  return (
    <View style={[styles.wheel, disabled && { opacity: 0.35 }]}>
      <Text variant="overline" tone="muted" style={styles.wheelLabel}>{label}</Text>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${show(value)} ${label}` }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 1 : -1)}
        style={{ height: ITEM * VISIBLE }}
      >
        <ScrollView
          ref={ref}
          scrollEnabled={!disabled}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: index * ITEM }}
          onLayout={() => ref.current?.scrollTo({ y: index * ITEM, animated: false })}
          contentContainerStyle={{ paddingVertical: ITEM * Math.floor(VISIBLE / 2) }}
          scrollEventThrottle={32}
          onScroll={(e) => setLive(Math.round(e.nativeEvent.contentOffset.y / ITEM))}
          onMomentumScrollEnd={settle}
          onScrollEndDrag={(e) => {
            // No fling: the drag itself ends the move.
            if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) settle(e);
          }}
          nestedScrollEnabled
        >
          {values.map((v, i) => {
            const dist = Math.abs(i - live);
            return (
              <Pressable key={v} disabled={disabled} onPress={() => onChange(v)} style={styles.item}>
                <Text
                  variant="metric"
                  style={{
                    fontSize: dist === 0 ? 26 : dist === 1 ? 20 : 16,
                    color: dist === 0 ? colors.text : dist === 1 ? colors.textMuted : colors.border,
                  }}
                >
                  {show(v)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingTop: spacing.sm, paddingHorizontal: spacing.xl, gap: spacing.lg },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3 },
  wheels: { flexDirection: "row", gap: spacing.sm },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    // label (14) + its margin (6) + 2 rows above the middle one
    top: 14 + 6 + ITEM * Math.floor(VISIBLE / 2),
    height: ITEM,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  wheel: { flex: 1, alignItems: "stretch" },
  wheelLabel: { textAlign: "center", marginBottom: 6, height: 14 },
  item: { height: ITEM, alignItems: "center", justifyContent: "center" },
  ends: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  buttons: { flexDirection: "row", gap: spacing.sm },
});
