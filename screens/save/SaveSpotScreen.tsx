import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { dayBucket, formatClock, formatDayMonth } from "../../domain/time";
import { RootStackParamList } from "../../navigation/types";
import { areaLine } from "../../services/geocoding";
import {
  getSpot,
  hasActiveLimit,
  insertSpot,
  locateHere,
  LocationPermissionError,
  PendingLocation,
  remindBeforeFor,
  setTimeLimit,
  Spot,
  spotName,
  stopReminder,
  updateSpotDetails,
} from "../../services/spots-service";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/tokens";
import { AddressCard, Button, IconButton, Pill, Text } from "../../ui";
import { ReminderWarning } from "../../ui/ReminderWarning";
import { useReminderReadiness, warningKey } from "../../state/remindersStore";
import { Field } from "../../ui/Field";
import { usePrefs } from "../../state/prefs";

type Props = NativeStackScreenProps<RootStackParamList, "SaveSpot">;

const LIMITS = [0, 30, 60, 120, 240];

type Locate = { status: "locating" } | { status: "ready"; loc: PendingLocation } | { status: "error"; permission: boolean };

/**
 * Bottom sheet for a new or an existing spot.
 * New spot: the location is found here, and NOTHING is written until Save.
 * Closing the sheet (✕, backdrop, back) discards it. Every field is optional.
 */
export default function SaveSpotScreen({ route, navigation }: Props) {
  const { id, kind } = route.params;
  const isNew = id === undefined;
  const { t } = useTranslation();
  const warns = !!warningKey(useReminderReadiness());
  const { colors } = useTheme();
  const prefs = usePrefs();
  const levelPlaceholder = prefs.levelLabels === "signed" ? "−2" : "B2";
  // Paid time ≤ "Remind me before" makes no sense (Z1): those choices are disabled.
  const tooShort = (m: number) => m > 0 && m <= prefs.remindBeforeMin;
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const isParking = kind === "parking";

  const [spot, setSpot] = useState<Spot | null>(null);
  const [level, setLevel] = useState("");
  const [section, setSection] = useState("");
  const [spotNo, setSpotNo] = useState("");
  const [title, setTitle] = useState("");
  const [comments, setComments] = useState("");
  /** undefined = keep the current limit (when editing). 0 = none. */
  const [limit, setLimit] = useState<number | undefined>(isNew ? 0 : undefined);
  const [locate, setLocate] = useState<Locate>({ status: "locating" });
  const [saving, setSaving] = useState(false);
  /** Name & note are tucked away until needed; open when editing a spot that has them. */
  const [detailsOpen, setDetailsOpen] = useState(false);
  const zoneRef = useRef<TextInput>(null);
  const spotRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const openedAt = useRef(Date.now()).current;

  const findLocation = useCallback(async () => {
    setLocate({ status: "locating" });
    try {
      setLocate({ status: "ready", loc: await locateHere() });
    } catch (e) {
      console.warn("locateHere failed:", e);
      setLocate({ status: "error", permission: e instanceof LocationPermissionError });
    }
  }, []);

  useEffect(() => {
    if (isNew) findLocation();
  }, [isNew, findLocation]);

  useEffect(() => {
    if (id === undefined) return;
    getSpot(db, id).then((s) => {
      if (!s) return;
      setSpot(s);
      setLevel(s.level ?? "");
      setSection(s.section ?? "");
      setSpotNo(s.spot ?? "");
      setTitle(s.title ?? "");
      setComments(s.comments ?? "");
      if (s.title || s.comments) setDetailsOpen(true);
    });
  }, [db, id]);

  const close = () => navigation.goBack();

  const canSave = !saving && (!isNew || locate.status === "ready");

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const spotId = isNew && locate.status === "ready" ? await insertSpot(db, kind, locate.loc) : id!;
      await updateSpotDetails(db, spotId, { title, level, section, spot: spotNo, comments });
      let text2: string | undefined;
      if (isParking && limit !== undefined) {
        if (limit > 0) {
          const endsAt = Date.now() + limit * 60_000;
          const name = title.trim() || (spot ? spotName(spot, t("v2.parked.title")) : t("v2.parked.title"));
          const ok = await setTimeLimit(db, spotId, name, endsAt);
          text2 = ok ? t("v2.save.reminder_set", { time: formatClock(endsAt) }) : undefined;
        } else {
          await stopReminder(db, spotId);
        }
      }
      if (isNew) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      Toast.show({ type: "success", text1: isParking ? t("v2.save.saved_parking") : t("v2.save.saved_place"), text2 });
      navigation.goBack();
    } catch (e) {
      console.error("save details failed:", e);
      Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.errors.save_failed") });
    } finally {
      setSaving(false);
    }
  };

  const limitLabel = (m: number) =>
    m === 0 ? t("v2.save.off") : m < 60 ? `${m} ${t("v2.units.min")}` : `${m / 60} ${t("v2.units.h")}`;
  const currentLimitEnds = spot && hasActiveLimit(spot) ? spot.reminderEndsAt : null;

  // "Today, 13:18" for parking; for an existing spot, when it was saved.
  const when = spot ? new Date(spot.timestamp).getTime() : openedAt;
  const whenText =
    dayBucket(when) === "today"
      ? t("v2.save.today_at", { time: formatClock(when) })
      : t("v2.save.on_day", { day: formatDayMonth(when), time: formatClock(when) });
  const subtitle = isParking ? whenText : t("v2.save.place_sub");

  // Paid time hint: "Ends 14:18 · we'll remind you at 14:03".
  let limitHint: string | null = null;
  let remindAt: number | null = null;
  let endsLabel = "";
  if (limit !== undefined && limit > 0) {
    const end = Date.now() + limit * 60_000;
    const at = end - remindBeforeFor(end) * 60_000;
    remindAt = at;
    endsLabel = t("v2.save.ends", { end: formatClock(end) });
    limitHint = t("v2.save.ends_remind", { end: formatClock(end), at: formatClock(at) });
  } else if (limit === undefined && currentLimitEnds) {
    limitHint = t("v2.save.ends", { end: formatClock(currentLimitEnds) });
  }

  // Address: the freshly found location (new) or the stored one (edit).
  const addr =
    isNew && locate.status === "ready"
      ? {
          street: locate.loc.street ?? t("v2.park.location_found"),
          area: areaLine(
            { district: locate.loc.district, city: locate.loc.city, region: locate.loc.region, country: locate.loc.country },
            locate.loc.street,
          ),
          accuracy: locate.loc.accuracy,
        }
      : !isNew && spot
        ? {
            street: spot.street ?? t("v2.park.location_found"),
            area: areaLine({ city: spot.city, region: spot.region, country: spot.country }, spot.street),
            accuracy: spot.accuracyM,
          }
        : null;

  const openDetails = () => {
    setDetailsOpen(true);
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={close} accessibilityLabel={t("common.close")} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        <View style={styles.titleRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title" accessibilityRole="header">{isParking ? t("v2.save.title_parking") : t("v2.save.title_place")}</Text>
            <Text variant="small" tone="muted">{subtitle}</Text>
          </View>
          <IconButton accessibilityLabel={t("common.close")} onPress={close}>
            <Ionicons name="close" size={22} color={colors.text} />
          </IconButton>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {isNew && locate.status === "locating" ? (
            <View style={[styles.hint, { backgroundColor: colors.surfaceRaised }]}>
              <ActivityIndicator size="small" color={colors.accentFg} />
              <Text variant="small" tone="secondary" style={{ flex: 1 }}>{t("v2.park.locating")}</Text>
            </View>
          ) : isNew && locate.status === "error" ? (
            <View style={[styles.hint, { backgroundColor: colors.surfaceRaised }]}>
              <Ionicons name="warning-outline" size={20} color={colors.alert} />
              <Text variant="small" tone="secondary" style={{ flex: 1 }}>
                {locate.permission ? t("v2.errors.permission") : t("v2.park.no_location_hint")}
              </Text>
              <Pressable accessibilityRole="button" onPress={findLocation} hitSlop={8} style={styles.retry}>
                <Text variant="smallStrong" tone="accent">{t("v2.save.retry")}</Text>
              </Pressable>
            </View>
          ) : addr ? (
            <AddressCard street={addr.street} area={addr.area} accuracy={addr.accuracy} />
          ) : null}

          {isParking ? (
            <View style={styles.group}>
              <Text variant="overline" tone="muted">
                {t("v2.save.level_zone_spot")}
                <Text variant="small" tone="muted" style={styles.optionalTag}>{`  —  ${t("v2.save.optional_short")}`}</Text>
              </Text>
              <View style={styles.triple}>
                <Field
                  containerStyle={{ flex: 1 }}
                  metric
                  hideLabel
                  label={t("v2.save.level")}
                  value={level}
                  onChangeText={setLevel}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  placeholder={levelPlaceholder}
                  returnKeyType="next"
                  onSubmitEditing={() => zoneRef.current?.focus()}
                />
                <Field
                  ref={zoneRef}
                  containerStyle={{ flex: 1 }}
                  metric
                  hideLabel
                  label={t("v2.save.zone")}
                  value={section}
                  onChangeText={setSection}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  placeholder="C"
                  returnKeyType="next"
                  onSubmitEditing={() => spotRef.current?.focus()}
                />
                <Field
                  ref={spotRef}
                  containerStyle={{ flex: 1 }}
                  metric
                  hideLabel
                  label={t("v2.save.spot")}
                  value={spotNo}
                  onChangeText={setSpotNo}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                  placeholder="14"
                />
              </View>
            </View>
          ) : null}

          {isParking ? (
            <View style={styles.group}>
              <Text variant="overline" tone="muted">{t("v2.save.paid_time")}</Text>
              <View style={styles.pills}>
                {LIMITS.map((m) => (
                  <Pill key={m} label={limitLabel(m)} selected={limit === m} disabled={tooShort(m)} onPress={() => setLimit(m)} />
                ))}
              </View>
              {LIMITS.some(tooShort) ? (
                <Text variant="small" tone="muted">
                  {t("v2.save.limit_too_short", { n: prefs.remindBeforeMin })}
                </Text>
              ) : null}
              {/* Reminder would not arrive / arrive late → orange box with the fix (X1) instead of the hint. */}
              {remindAt && warns ? <ReminderWarning remindAt={remindAt} prefix={endsLabel} /> : null}
              {limitHint && !(remindAt && warns) ? (
                <View style={styles.limitHint}>
                  <Ionicons name="notifications-outline" size={16} color={colors.accentFg} />
                  <Text variant="small" tone="secondary" style={{ flex: 1 }}>{limitHint}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {detailsOpen ? (
            <View style={styles.group}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: true }}
                accessibilityLabel={t("v2.save.name_note")}
                accessibilityHint={t("v2.save.hide")}
                onPress={() => setDetailsOpen(false)}
                hitSlop={8}
                style={styles.detailsHeader}
              >
                <Text variant="overline" tone="muted" style={{ flex: 1 }}>{t("v2.save.name_note")}</Text>
                <Text variant="smallStrong" tone="secondary">{t("v2.save.hide")}</Text>
                <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
              </Pressable>
              <Field
                ref={nameRef}
                label={t("v2.save.name")}
                value={title}
                onChangeText={setTitle}
                placeholder={isParking ? t("v2.save.name_placeholder") : t("v2.save.name_placeholder_place")}
                maxLength={60}
                returnKeyType="next"
              />
              <Field
                label={t("v2.save.note")}
                value={comments}
                onChangeText={setComments}
                placeholder={isParking ? t("v2.save.note_placeholder") : t("v2.save.note_placeholder_place")}
                multiline
                maxLength={300}
                style={{ minHeight: 72, paddingTop: 14, textAlignVertical: "top" }}
              />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t("v2.save.name_note")}, ${t("v2.save.optional_short")}`}
              onPress={openDetails}
              style={({ pressed }) => [
                styles.addDetails,
                { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceRaised : "transparent" },
              ]}
            >
              <Ionicons name={title || comments ? "create-outline" : "add"} size={20} color={colors.textMuted} />
              <Text variant="bodyStrong" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
                {title || comments || t("v2.save.name_note")}
              </Text>
              {title || comments ? (
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              ) : (
                <Text variant="small" tone="muted">{t("v2.save.optional_short")}</Text>
              )}
            </Pressable>
          )}
        </ScrollView>

        <Button
          kind="primary"
          size="lg"
          label={t("v2.save.save")}
          loading={saving}
          disabled={!saving && !canSave}
          onPress={save}
          style={{ marginHorizontal: spacing.xl, marginTop: spacing.md }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingTop: spacing.sm, maxHeight: "92%" },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, marginBottom: spacing.sm },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing.sm },
  hint: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: "center", minHeight: 52 },
  retry: { minHeight: 44, justifyContent: "center" },
  group: { gap: spacing.xs },
  optionalTag: { textTransform: "none", letterSpacing: 0 },
  triple: { flexDirection: "row", gap: spacing.sm },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  detailsHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 32 },
  limitHint: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 },
  addDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
});
