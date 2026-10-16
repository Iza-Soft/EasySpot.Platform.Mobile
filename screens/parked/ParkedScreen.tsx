import { Ionicons } from "@expo/vector-icons";
import { zoneColorHex } from "../../domain/zone-color";
import { SpotPhotoCard } from "../../ui/SpotPhotoCard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import { formatClock, formatDuration, formatEnd, formatLimit } from "../../domain/time";
import { useNow, useSpot } from "../../hook/useSpots";
import { useFloorsToCar } from "../../hook/useFloorsToCar";
import { useIsFocused } from "@react-navigation/native";
import { FloorsLine } from "../../ui/FloorsLine";
import { RootStackParamList } from "../../navigation/types";
import { areaLine } from "../../services/geocoding";
import { getPreferredMap } from "../../services/map-preference-service";
import { openMapsAsync, ShareLocationAsync } from "../../services/navigation-service";
import {
  endParking,
  isActiveParking,
  limitSnapshot,
  restoreTimeLimit,
  setTimeLimit,
  spotName,
  updateSpotLevel,
} from "../../services/spots-service";
import { DurationSheet, MAX_LIMIT_DAYS } from "../save/DurationSheet";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/tokens";
import { AddressCard, AppHeader, Button, Card, IconButton, Text, TimeBar } from "../../ui";
import { Field } from "../../ui/Field";
import { Screen } from "../../ui/Screen";
import { displayLevel } from "../../domain/level";
import { usePrefs } from "../../state/prefs";
import { ReminderWarning } from "../../ui/ReminderWarning";

type Props = NativeStackScreenProps<RootStackParamList, "Parked">;

/**
 * An ACTIVE parking (mockup P4): opened from Spots. Level, address with
 * accuracy, paid time as a bar, FIND MY CAR, Share / Edit, End parking.
 */
export default function ParkedScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const levelPlaceholder = usePrefs().levelLabels === "signed" ? "−2" : "B2";
  const db = useSQLiteContext();
  const spot = useSpot(id);
  const { levelLabels, remindBeforeMin, floorsEnabled } = usePrefs();
  const now = useNow(30_000);
  // "3 floors below you" — live while this screen is in front (mockups B1–B3).
  const focused = useIsFocused();
  const floors = useFloorsToCar(spot, floorsEnabled && focused && !!spot && !spot.endedAt);
  const [busy, setBusy] = useState(false);
  /** The wheels for the paid time (mockup E3). */
  const [timeOpen, setTimeOpen] = useState(false);
  // Inline level editor (only level / zone / spot — the full form is under Edit).
  const [levelOpen, setLevelOpen] = useState(false);
  const [level, setLevel] = useState("");
  const [section, setSection] = useState("");
  const [spotNo, setSpotNo] = useState("");
  const zoneRef = useRef<TextInput>(null);
  const spotRef = useRef<TextInput>(null);
  const levelRef = useRef<TextInput>(null);
  const units = { d: t("v2.units.d"), h: t("v2.units.h"), min: t("v2.units.min") };

  // Opened from a reminder (easyspot://spot/<id>) after the parking already ended → its details instead.
  // Checked once on open, so "End parking" here still just goes back.
  const checked = useRef(false);
  useEffect(() => {
    if (!spot || checked.current) return;
    checked.current = true;
    if (!isActiveParking(spot)) navigation.replace("SpotDetails", { id: spot.id });
  }, [spot, navigation]);

  if (!spot) return <Screen><View /></Screen>;

  const parkedAt = new Date(spot.timestamp).getTime();
  const hasDetails = !!(spot.level || spot.section || spot.spot || spot.zoneColor);
  const ends = spot.reminderActive && spot.reminderEndsAt ? spot.reminderEndsAt : null;
  const expired = !!ends && ends <= now;
  const total = ends ? Math.max(1, ends - (spot.reminderStartedAt ?? parkedAt)) : 1;
  const remindAt = ends ? ends - (spot.notifyBeforeMinutes ?? remindBeforeMin) * 60_000 : null;

  const edit = () => navigation.navigate("SaveSpot", { id: spot.id, kind: "parking" });
  const find = async () => openMapsAsync({ latitude: spot.latitude, longitude: spot.longitude, map: await getPreferredMap() });

  const title = spotName(spot, t("v2.parked.title"));

  /** +30 min, with Undo for a few seconds — a wrong tap is put right at once (mockup E2). */
  const extend = async () => {
    if (!ends || busy) return;
    setBusy(true);
    try {
      const before = limitSnapshot(spot);
      const endsAt = Math.max(Date.now(), ends) + 30 * 60_000;
      await setTimeLimit(db, spot.id, title, endsAt);
      Toast.show({
        type: before ? "undo" : "success",
        text1: t("v2.parked.extended", { time: formatEnd(endsAt) }),
        visibilityTime: 5000,
        props: before
          ? {
              actionLabel: t("v2.parked.undo"),
              onAction: () => {
                restoreTimeLimit(db, spot.id, title, before)
                  .then(() => Toast.show({ type: "success", text1: t("v2.parked.undone", { time: formatEnd(before.endsAt) }) }))
                  .catch((e) => {
                    console.error(e);
                    Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.errors.generic") });
                  });
              },
            }
          : undefined,
      });
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.errors.generic") });
    } finally {
      setBusy(false);
    }
  };

  /** Tap "until 14:18" → the wheels with the time left from now (mockup E3); shorter or longer. */
  const changeTime = async (minutes: number) => {
    setTimeOpen(false);
    if (busy) return;
    setBusy(true);
    try {
      const endsAt = Date.now() + minutes * 60_000;
      const ok = await setTimeLimit(db, spot.id, title, endsAt);
      Toast.show({
        type: "success",
        text1: t("v2.parked.changed", { time: formatEnd(endsAt) }),
        text2: ok ? undefined : t("v2.errors.generic"),
      });
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.errors.generic") });
    } finally {
      setBusy(false);
    }
  };

  const openLevel = () => {
    setLevel("");
    setSection("");
    setSpotNo("");
    setLevelOpen(true);
    setTimeout(() => levelRef.current?.focus(), 50);
  };

  const saveLevel = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateSpotLevel(db, spot.id, { level, section, spot: spotNo });
      setLevelOpen(false);
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.errors.save_failed") });
    } finally {
      setBusy(false);
    }
  };

  const end = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await endParking(db, spot.id);
      Toast.show({ type: "success", text1: t("v2.parked.ended") });
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.errors.generic") });
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title={t("v2.parked.title_default")} />
      <View style={styles.header}>
        <IconButton accessibilityLabel={t("v2.common.back")} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </IconButton>
        <View style={[styles.liveDot, { backgroundColor: expired ? colors.alert : colors.accentFg }]} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>{spot.title || t("v2.parked.title_default")}</Text>
          <Text variant="small" tone="muted">
            {t("v2.parked.since", { time: formatClock(parkedAt), duration: formatDuration(now - parkedAt, units) })}
          </Text>
        </View>
      </View>

      <Card style={styles.spotCard}>
        {hasDetails ? (
          <View style={styles.levelRow}>
            <View style={{ flexShrink: 1 }}>
              <Text variant="overline" tone="muted">{t("v2.parked.level")}</Text>
              <Text variant="levelHero" tone="level" numberOfLines={1} adjustsFontSizeToFit>{displayLevel(spot.level, levelLabels) || "—"}</Text>
            </View>
            <View style={styles.zoneCol}>
              {spot.section || zoneColorHex(spot.zoneColor) ? (
                <Detail
                  label={t("v2.parked.zone")}
                  value={spot.section ?? ""}
                  color={zoneColorHex(spot.zoneColor)}
                  colorLabel={spot.zoneColor ? t(`v2.colors.${spot.zoneColor}`) : undefined}
                />
              ) : null}
              {spot.spot ? <Detail label={t("v2.parked.spot")} value={spot.spot} /> : null}
            </View>
          </View>
        ) : null}
        {floors != null ? <FloorsLine floors={floors} /> : null}
        <AddressCard
          street={spot.street ?? t("v2.park.location_found")}
          area={areaLine({ city: spot.city, region: spot.region, country: spot.country }, spot.street)}
          accuracy={spot.accuracyM}
        />
        {spot.comments ? (
          <View style={[styles.note, { backgroundColor: colors.surfaceRaised }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.textMuted} />
            <Text variant="small" tone="secondary" style={{ flex: 1 }}>{spot.comments}</Text>
          </View>
        ) : null}
        {!hasDetails && !levelOpen ? (
          // Same pattern as "Name & note" in the Save sheet, with a Volt border.
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t("v2.parked.add_details")}, ${t("v2.save.optional_short")}`}
            onPress={openLevel}
            style={({ pressed }) => [
              styles.addRow,
              { borderColor: colors.accentFg, backgroundColor: pressed ? colors.surfaceRaised : "transparent" },
            ]}
          >
            <Ionicons name="add" size={20} color={colors.accentFg} />
            <Text variant="bodyStrong" tone="level" style={{ flex: 1 }}>{t("v2.parked.add_details")}</Text>
            <Text variant="small" tone="muted">{t("v2.save.optional_short")}</Text>
          </Pressable>
        ) : null}
        {!hasDetails && levelOpen ? (
          <View style={[styles.levelEditor, { borderColor: colors.accentFg }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: true }}
              accessibilityHint={t("v2.save.hide")}
              onPress={() => setLevelOpen(false)}
              hitSlop={8}
              style={styles.editorHeader}
            >
              <Text variant="overline" tone="muted" style={{ flex: 1 }}>
                {t("v2.save.level_zone_spot")}
                <Text variant="small" tone="muted" style={styles.optionalTag}>{`  —  ${t("v2.save.optional_short")}`}</Text>
              </Text>
              <Text variant="smallStrong" tone="secondary">{t("v2.save.hide")}</Text>
              <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
            </Pressable>
            <View style={styles.triple}>
              <Field
                ref={levelRef}
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
                returnKeyType="done"
                onSubmitEditing={saveLevel}
              />
            </View>
            <Button
              kind="primary"
              label={t("v2.save.save")}
              onPress={saveLevel}
              loading={busy}
              disabled={!level.trim() && !section.trim() && !spotNo.trim()}
            />
          </View>
        ) : null}
      </Card>

      <SpotPhotoCard photo={spot.photoUri} />

      {ends ? (
        <Card style={[styles.timeCard, expired && { borderColor: colors.alert, borderWidth: 1.5 }]}>
          <View style={styles.between}>
            <Text variant="overline" tone={expired ? "alert" : "muted"}>{t("v2.parked.paid_time")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${expired ? t("v2.parked.ended_at", { time: formatEnd(ends) }) : t("v2.parked.until_short", { time: formatEnd(ends) })}`}
              accessibilityHint={t("v2.parked.change_time")}
              onPress={() => setTimeOpen(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.untilChip,
                { borderColor: colors.accentFg, backgroundColor: pressed ? colors.surfaceRaised : "transparent" },
              ]}
            >
              <Text variant="smallStrong">
                {expired ? t("v2.parked.ended_at", { time: formatEnd(ends) }) : t("v2.parked.until_short", { time: formatEnd(ends) })}
              </Text>
              <Ionicons name="pencil" size={13} color={colors.accentFg} />
            </Pressable>
          </View>
          <View style={styles.between}>
            <Text variant="title" tone={expired ? "alert" : "level"} numberOfLines={1} style={{ flexShrink: 1, fontSize: 22 }}>
              {expired ? t("v2.parked.expired") : t("v2.parked.left_long", { d: formatDuration(ends - now, units) })}
            </Text>
            <Button label={t("v2.parked.extend")} onPress={extend} loading={busy} style={{ paddingHorizontal: spacing.lg }} />
          </View>
          {expired ? (
            <Text variant="small" tone="alert">{t("v2.parked.over", { d: formatDuration(now - ends, units) })}</Text>
          ) : null}
          <TimeBar fraction={(ends - now) / total} height={10} expired={expired} />
          {spot.ticketEntryAt && spot.freeMinutes ? (
            // Mall / garage entry ticket (mockup M3).
            <View style={styles.ticketLine}>
              <Ionicons name="ticket-outline" size={15} color={colors.textMuted} />
              <Text variant="small" tone="muted" style={{ flex: 1 }}>
                {t("v2.ticket.parked_line", {
                  time: formatClock(spot.ticketEntryAt),
                  free: formatLimit(spot.freeMinutes, units),
                })}
              </Text>
            </View>
          ) : null}
          {/* The reminder is still ahead but the phone would hold it back → orange box with the fix (X2). */}
          {remindAt && remindAt > now ? <ReminderWarning remindAt={remindAt} /> : null}
        </Card>
      ) : null}

      <Button
        kind="primary"
        size="lg"
        label={t("v2.parked.find")}
        icon={<Ionicons name="navigate" size={20} color={colors.onAccent} />}
        onPress={find}
        style={{ marginTop: spacing.sm }}
      />
      <View style={styles.row}>
        <Button
          style={{ flex: 1 }}
          label={t("v2.parked.share")}
          onPress={() => ShareLocationAsync({ latitude: spot.latitude, longitude: spot.longitude })}
        />
        <Button style={{ flex: 1 }} label={t("v2.parked.edit")} onPress={edit} />
      </View>
      {/* Long in some languages ("Приключи паркирането"), so it gets its own row. */}
      <Button label={t("v2.parked.back")} onPress={end} disabled={busy} style={{ marginTop: spacing.sm }} />
      {ends ? (
        <DurationSheet
          visible={timeOpen}
          // Time left from now, in whole minutes; an expired time opens at 0.
          initialMinutes={Math.min(MAX_LIMIT_DAYS * 1440, Math.max(0, Math.floor((ends - Date.now()) / 60_000)))}
          minMinutes={remindBeforeMin}
          subtitle={t("v2.duration.from_now", { n: MAX_LIMIT_DAYS })}
          onCancel={() => setTimeOpen(false)}
          onDone={changeTime}
        />
      ) : null}
    </Screen>
  );
}

function Detail({
  label,
  value,
  color,
  colorLabel,
}: {
  label: string;
  value: string;
  /** Zone colour dot (photo of the spot / the colour field). */
  color?: string | null;
  colorLabel?: string;
}) {
  return (
    <View style={{ alignItems: "flex-end" }} accessible accessibilityLabel={[label, value, colorLabel].filter(Boolean).join(", ")}>
      <Text variant="overline" tone="muted">{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {color ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color, borderWidth: 1, borderColor: "rgba(0,0,0,0.25)" }} /> : null}
        {value ? <Text variant="title" numberOfLines={1}>{value}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  liveDot: { width: 10, height: 10, borderRadius: 5 },
  ticketLine: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  untilChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  spotCard: { gap: spacing.md, borderRadius: radius.xxl, marginBottom: spacing.md },
  levelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  zoneCol: { gap: spacing.sm, paddingBottom: 6 },
  note: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", padding: spacing.md, borderRadius: radius.md },
  timeCard: { gap: spacing.sm, marginBottom: spacing.md },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  levelEditor: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed" },
  editorHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 32 },
  optionalTag: { textTransform: "none", letterSpacing: 0 },
  triple: { flexDirection: "row", gap: spacing.sm },
});
