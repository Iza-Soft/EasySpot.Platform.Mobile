import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { fillField, nameWithPlate } from "../../domain/photo-fill";
import { dayBucket, formatClock, formatDayMonth, formatEnd, formatLimit } from "../../domain/time";
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
import { PlateBadge } from "../../ui/PlateBadge";
import { PhotoViewer } from "../../ui/PhotoViewer";
import { getPrefs, usePrefs } from "../../state/prefs";
import { deletePhoto, photoUri as photoFileUri } from "../../services/spot-photos";
import { CapturedPhoto, PhotoCapture } from "./PhotoCapture";
import { DurationSheet } from "./DurationSheet";
import { readPressure } from "../../platform/barometer";
import { ZoneColorRow } from "./ZoneColorRow";

type Props = NativeStackScreenProps<RootStackParamList, "SaveSpot">;

/** Quick choices (mockup O1); anything else — up to 15 days — through "Other". */
const LIMITS = [0, 30, 60, 120];

/** What the last photo put into the form (so Retake can replace it, but never what the user typed). */
interface Filled {
  level?: string;
  zone?: string;
  spot?: string;
  color?: string;
  /** Compact plate in the Name ("SA63USM"). */
  plate?: string;
}

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
  const [zoneColor, setZoneColor] = useState<string | null>(null);
  /** Photo of the spot: relative path + file:// URI (mockups F1–F6). */
  const [photo, setPhoto] = useState<{ rel: string; uri: string } | null>(null);
  /** The car plate shown on the photo row ("SA63 USM"; none → "xxxxxx"). */
  const [plate, setPlate] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  /** Paid time read from a paper ticket: the end as a moment (mockups T1–T4). */
  const [ticketOpen, setTicketOpen] = useState(false);
  /** Mall / garage entry ticket (mockups M1–M3): free from the entry time for N minutes. */
  const [free, setFree] = useState<{ entryAt: number; minutes: number } | null>(null);
  const filled = useRef<Filled>({});
  /** The photo the parking had when the sheet opened (edit) — deleted only when Save replaces / removes it. */
  const originalPhoto = useRef<string | null>(null);
  const photoRef = useRef<string | null>(null);
  const saved = useRef(false);
  const zoneRef = useRef<TextInput>(null);
  const spotRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const openedAt = useRef(Date.now()).current;

  const findLocation = useCallback(async () => {
    setLocate({ status: "locating" });
    try {
      // Parking: the air pressure on the car's floor, measured while locating (no extra wait).
      const [loc, pressureHPa] = await Promise.all([
        locateHere(),
        // Only with "Floors to your car" on in Settings (off by default).
        isParking && getPrefs().floorsEnabled ? readPressure().catch(() => null) : Promise.resolve(null),
      ]);
      setLocate({ status: "ready", loc: { ...loc, pressureHPa } });
    } catch (e) {
      console.warn("locateHere failed:", e);
      setLocate({ status: "error", permission: e instanceof LocationPermissionError });
    }
  }, [isParking]);

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
      setZoneColor(s.zoneColor ?? null);
      if (s.ticketEntryAt && s.freeMinutes && hasActiveLimit(s)) setFree({ entryAt: s.ticketEntryAt, minutes: s.freeMinutes });
      setPlate(s.plate ?? null);
      if (s.plate) filled.current.plate = s.plate.replace(/[\s-]/g, "");
      const uri = photoFileUri(s.photoUri);
      if (s.photoUri && uri) {
        originalPhoto.current = s.photoUri;
        setPhoto({ rel: s.photoUri, uri });
      }
      if (s.title || s.comments) setDetailsOpen(true);
    });
  }, [db, id]);

  photoRef.current = photo?.rel ?? null;
  // Closing without Save (✕, backdrop, back): a photo taken here is not kept (decided 15.10).
  useEffect(
    () => () => {
      if (!saved.current && photoRef.current && photoRef.current !== originalPhoto.current) deletePhoto(photoRef.current);
    },
    [],
  );

  const close = () => navigation.goBack();

  /** A new photo: fill only what was recognised; what the user typed stays (mockups F4/F5). */
  const onPhoto = (p: CapturedPhoto) => {
    setCaptureOpen(false);
    setViewerOpen(false);
    if (photo && photo.rel !== originalPhoto.current) deletePhoto(photo.rel);
    setPhoto({ rel: p.rel, uri: p.uri });
    const { scan } = p;
    const f = filled.current;
    const lv = fillField(level, f.level, scan.level);
    const zn = fillField(section, f.zone, scan.zone);
    const sp = fillField(spotNo, f.spot, scan.spot);
    const cl = fillField(zoneColor ?? "", f.color, scan.color);
    setLevel(lv.value);
    setSection(zn.value);
    setSpotNo(sp.value);
    setZoneColor(cl.value || null);
    if (scan.plate) {
      setTitle((cur) => nameWithPlate(cur, scan.plate!.compact, f.plate));
      setPlate(scan.plate.display);
    }
    filled.current = { level: lv.filled, zone: zn.filled, spot: sp.filled, color: cl.filled, plate: scan.plate?.compact ?? f.plate };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  };

  /** Remove (F6): the photo goes; the filled fields stay — the user may have checked them already. */
  const removePhoto = () => {
    setViewerOpen(false);
    if (photo && photo.rel !== originalPhoto.current) deletePhoto(photo.rel);
    setPhoto(null);
  };

  const retakePhoto = () => {
    setViewerOpen(false);
    setCaptureOpen(true);
  };

  const canSave = !saving && (!isNew || locate.status === "ready");

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const spotId = isNew && locate.status === "ready" ? await insertSpot(db, kind, locate.loc) : id!;
      await updateSpotDetails(db, spotId, {
        title,
        level,
        section,
        spot: spotNo,
        comments,
        ...(isParking
          ? {
              zoneColor,
              photoUri: photo?.rel ?? null,
              plate,
              // Kept only while the time comes from the entry ticket (Parked shows "entered 13:18 · 2 h free").
              ...(limit !== undefined || free
                ? { ticketEntryAt: free?.entryAt ?? null, freeMinutes: free?.minutes ?? null }
                : {}),
            }
          : {}),
      });
      saved.current = true;
      // Retake / Remove + Save: the old photo goes now.
      if (originalPhoto.current && originalPhoto.current !== photo?.rel) deletePhoto(originalPhoto.current);
      let text2: string | undefined;
      const freeEnd = free ? free.entryAt + free.minutes * 60_000 : null;
      if (isParking && freeEnd && freeEnd > Date.now()) {
        const name = title.trim() || (spot ? spotName(spot, t("v2.parked.title")) : t("v2.parked.title"));
        const ok = await setTimeLimit(db, spotId, name, freeEnd);
        text2 = ok ? t("v2.save.reminder_set", { time: formatEnd(freeEnd) }) : undefined;
      } else if (isParking && limit !== undefined) {
        if (limit > 0) {
          const endsAt = Date.now() + limit * 60_000;
          const name = title.trim() || (spot ? spotName(spot, t("v2.parked.title")) : t("v2.parked.title"));
          const ok = await setTimeLimit(db, spotId, name, endsAt);
          text2 = ok ? t("v2.save.reminder_set", { time: formatEnd(endsAt) }) : undefined;
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

  const units = { d: t("v2.units.d"), h: t("v2.units.h"), min: t("v2.units.min") };
  const limitLabel = (m: number) => (m === 0 ? t("v2.save.off") : formatLimit(m, units));
  // The free time of an entry ticket shows as a normal button: 1 h / 2 h marked, 3 h / 4 h … on the last one (M2).
  const freeQuick = free && LIMITS.includes(free.minutes) ? free.minutes : null;
  const isOther =
    (!!free && !freeQuick) || (!free && limit !== undefined && limit > 0 && !LIMITS.includes(limit));
  const pickLimit = (m: number) => {
    setFree(null);
    setLimit(m);
  };
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
  if (free) {
    const end = free.entryAt + free.minutes * 60_000;
    const at = end - remindBeforeFor(end) * 60_000;
    remindAt = end > Date.now() ? at : null;
    endsLabel = t("v2.save.ends", { end: formatEnd(end) });
    limitHint = t("v2.ticket.free_hint", { entry: formatClock(free.entryAt), end: formatEnd(end), at: formatClock(at) });
  } else if (limit !== undefined && limit > 0) {
    const end = Date.now() + limit * 60_000;
    const at = end - remindBeforeFor(end) * 60_000;
    remindAt = at;
    endsLabel = t("v2.save.ends", { end: formatEnd(end) });
    // A reminder on the same day as the end needs only its clock: "Ends 16.10, 15:48 · … at 15:33".
    const atText = new Date(at).toDateString() === new Date(end).toDateString() ? formatClock(at) : formatEnd(at);
    limitHint = t("v2.save.ends_remind", { end: formatEnd(end), at: atText });
  } else if (limit === undefined && currentLimitEnds) {
    limitHint = t("v2.save.ends", { end: formatEnd(currentLimitEnds) });
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

          {isParking ? <ZoneColorRow value={zoneColor} onChange={setZoneColor} /> : null}

          {isParking ? (
            <View style={styles.group}>
              <View style={styles.paidHead}>
                <Text variant="overline" tone="muted">{t("v2.save.paid_time")}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setTicketOpen(true)}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.scanChip,
                    { borderColor: colors.accentFg, backgroundColor: pressed ? colors.surfaceRaised : "transparent" },
                  ]}
                >
                  <Ionicons name="ticket-outline" size={15} color={colors.accentFg} />
                  <Text variant="smallStrong">{t("v2.ticket.scan")}</Text>
                </Pressable>
              </View>
              <View style={styles.pills}>
                {LIMITS.map((m) => (
                  <Pill
                    key={m}
                    compact
                    label={limitLabel(m)}
                    selected={free ? freeQuick === m : limit === m}
                    disabled={tooShort(m)}
                    onPress={() => pickLimit(m)}
                  />
                ))}
                <Pill
                  compact
                  chevron
                  label={
                    free && !freeQuick
                      ? limitLabel(free.minutes)
                      : isOther
                          ? limitLabel(limit!)
                          : t("v2.save.other")
                  }
                  accessibilityLabel={
                    free && !freeQuick
                      ? `${t("v2.save.paid_time")}: ${limitLabel(free.minutes)}`
                      : isOther
                        ? `${t("v2.save.paid_time")}: ${limitLabel(limit!)}`
                        : t("v2.save.other")
                  }
                  selected={isOther}
                  onPress={() => setDurationOpen(true)}
                />
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

          {isParking ? (
            photo ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("v2.photo.title")}, ${plate ? t("v2.photo.plate", { plate }) : t("v2.photo.no_plate")}`}
                accessibilityHint={t("v2.photo.row_hint")}
                onPress={() => setViewerOpen(true)}
                style={({ pressed }) => [
                  styles.photoRow,
                  { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceRaised : "transparent" },
                ]}
              >
                <PlateBadge plate={plate} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>{t("v2.photo.title")}</Text>
                  <Text variant="small" tone="muted" numberOfLines={1}>{t("v2.photo.row_hint")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("v2.photo.title")}, ${t("v2.save.optional_short")}`}
                accessibilityHint={t("v2.photo.button_hint")}
                onPress={() => setCaptureOpen(true)}
                style={({ pressed }) => [
                  styles.photoRow,
                  styles.photoButton,
                  { borderColor: colors.accentFg, backgroundColor: pressed ? colors.surfaceRaised : "transparent" },
                ]}
              >
                <View style={[styles.photoIcon, { backgroundColor: colors.surfaceRaised }]}>
                  <Ionicons name="camera-outline" size={20} color={colors.accentFg} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodyStrong">{t("v2.photo.title")}</Text>
                  <Text variant="small" tone="muted">{t("v2.photo.button_hint")}</Text>
                </View>
              </Pressable>
            )
          ) : null}
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

      {isParking ? (
        <>
          <PhotoCapture visible={captureOpen} onClose={() => setCaptureOpen(false)} onDone={onPhoto} />
          <PhotoCapture
            visible={ticketOpen}
            mode="ticket"
            onClose={() => setTicketOpen(false)}
            onTicket={(endsAt) => {
              setTicketOpen(false);
              // The ticket's end becomes the time left, exactly as if typed by hand ("2 h 27 min"), no "until".
              pickLimit(Math.max(1, Math.round((endsAt - Date.now()) / 60_000)));
            }}
            onFree={(entryAt, minutes) => {
              setTicketOpen(false);
              setFree({ entryAt, minutes });
              setLimit(0);
            }}
            onManual={() => {
              setTicketOpen(false);
              setDurationOpen(true);
            }}
          />
          <PhotoViewer
            visible={viewerOpen}
            uri={photo?.uri ?? null}
            onClose={() => setViewerOpen(false)}
            onRetake={retakePhoto}
            onRemove={removePhoto}
          />
          <DurationSheet
            visible={durationOpen}
            initialMinutes={
              free
                ? Math.max(0, Math.floor((free.entryAt + free.minutes * 60_000 - Date.now()) / 60_000))
                : limit && limit > 0
                    ? limit // 30 min / 1 h / 2 h or a value from Other: the wheels start from it
                    : 0 // Off → 0 · 0 · 00
            }
            minMinutes={prefs.remindBeforeMin}
            onCancel={() => setDurationOpen(false)}
            onDone={(m) => {
              setDurationOpen(false);
              pickLimit(m);
            }}
          />
        </>
      ) : null}
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
  paidHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  scanChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  photoButton: { borderStyle: "dashed", borderWidth: 1.5 },
  photoIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
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
