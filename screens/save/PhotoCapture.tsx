import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Linking, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { keepPhoto, PhotoScan, scanSpotPhoto, SavedPhoto } from "../../services/photo-scan";
import { scanTicket } from "../../services/ocr-service";
import { remindBeforeFor } from "../../services/spots-service";
import { entryMoment, TicketRead, ticketEnd } from "../../domain/ticket-parse";
import { formatLimit } from "../../domain/time";
import { DurationSheet } from "./DurationSheet";
import { formatClock, formatDuration, formatEnd } from "../../domain/time";
import { deleteTempFile } from "../../services/spot-photos";
import { palette, radius, spacing } from "../../theme/tokens";
import { Text } from "../../ui";

export type CapturedPhoto = SavedPhoto & { scan: PhotoScan };

type Stage =
  | { kind: "camera" }
  | { kind: "check"; uri: string }
  | { kind: "reading"; uri: string }
  /** Ticket mode: what was read (null = no time on it). */
  | { kind: "ticket"; uri: string; read: TicketRead | null };

const WHITE = palette.textHigh;
const MUTED = palette.textLow;

/**
 * The camera (always dark).
 *  mode "spot" — photo of the spot (mockups F2–F3): "Is the photo clear?"
 *    Retake / Save. Save keeps the photo in the app's files and reads it on
 *    the phone; Parking then fills what was recognised.
 *  mode "ticket" — a paper parking ticket (mockups T2–T3, K1–K4): read at
 *    once, "Valid until 15:45" → Use, or Retake / Set by hand. The ticket
 *    photo is never kept.
 */
export function PhotoCapture({
  visible,
  mode = "spot",
  onClose,
  onDone,
  onTicket,
  onManual,
  onFree,
}: {
  visible: boolean;
  mode?: "spot" | "ticket";
  onClose: () => void;
  onDone?: (photo: CapturedPhoto) => void;
  /** Ticket: the end of the paid time (ms). */
  onTicket?: (endsAt: number) => void;
  /** Ticket: no usable time → the wheels. */
  onManual?: () => void;
  /** Mall / garage entry ticket: when the car went in and how long it is free (mockup M1). */
  onFree?: (entryAt: number, freeMinutes: number) => void;
}) {
  const ticketMode = mode === "ticket";
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [stage, setStage] = useState<Stage>({ kind: "camera" });
  const [torch, setTorch] = useState(false);
  const [shooting, setShooting] = useState(false);
  /** The camera's temporary picture, removed if it is not kept. */
  const pending = useRef<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStage({ kind: "camera" });
      setTorch(false);
    }
  }, [visible]);

  const dropPending = () => {
    deleteTempFile(pending.current);
    pending.current = null;
  };

  const close = () => {
    if (stage.kind === "reading") return;
    dropPending();
    onClose();
  };

  const shoot = async () => {
    if (!camera.current || shooting) return;
    setShooting(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) throw new Error("No photo");
      pending.current = photo.uri;
      setTorch(false);
      if (ticketMode) {
        setStage({ kind: "reading", uri: photo.uri });
        let read: TicketRead | null = null;
        try {
          read = (await scanTicket(photo.uri)).ticket;
        } catch (e) {
          console.warn("ticket read failed:", e);
        }
        setStage({ kind: "ticket", uri: photo.uri, read });
      } else {
        setStage({ kind: "check", uri: photo.uri });
      }
    } catch (e) {
      console.warn("take photo failed:", e);
      Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.photo.failed") });
    } finally {
      setShooting(false);
    }
  };

  const retake = () => {
    dropPending();
    setStage({ kind: "camera" });
  };

  const save = async () => {
    if (stage.kind !== "check") return;
    setStage({ kind: "reading", uri: stage.uri });
    try {
      const saved = await keepPhoto(stage.uri);
      pending.current = null; // moved into the app's files
      const scan = await scanSpotPhoto(saved.uri);
      onDone?.({ ...saved, scan });
    } catch (e) {
      console.warn("keep photo failed:", e);
      Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.photo.failed") });
      setStage({ kind: "check", uri: stage.uri });
    }
  };

  const onBack = () => (stage.kind === "check" || stage.kind === "ticket" ? retake() : close());

  // Ticket: the end as a moment, and whether it is still ahead.
  const ticketEndsAt = stage.kind === "ticket" && stage.read?.kind === "end" ? ticketEnd(new Date(), stage.read).getTime() : null;
  const useTicket = () => {
    if (!ticketEndsAt) return;
    dropPending();
    onTicket?.(ticketEndsAt);
  };
  const byHand = () => {
    dropPending();
    onManual?.();
  };
  const useFree = (entryAt: number, freeMinutes: number) => {
    dropPending();
    onFree?.(entryAt, freeMinutes);
  };

  let body: React.ReactNode;
  if (!permission) {
    body = <View style={styles.fill} />;
  } else if (!permission.granted) {
    body = (
      <View style={[styles.fill, styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Ionicons name="camera-outline" size={44} color={palette.volt} />
        <Text variant="body" style={[styles.white, styles.centerText]}>{t("v2.photo.camera_needed")}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
          style={[styles.primary, { alignSelf: "stretch" }]}
        >
          <Text variant="action" style={{ color: palette.ink }}>
            {(permission.canAskAgain ? t("v2.photo.allow_camera") : t("v2.photo.open_settings")).toUpperCase()}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={close} style={styles.textButton}>
          <Text variant="bodyStrong" style={styles.white}>{t("common.cancel")}</Text>
        </Pressable>
      </View>
    );
  } else if (stage.kind === "camera") {
    body = (
      <View style={styles.fill}>
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} />
        <View style={[styles.topBar, { top: insets.top + spacing.md }]}>
          <RoundButton icon="close" label={t("common.close")} onPress={close} />
          <View style={styles.hintPill}>
            <Text variant="smallStrong" style={styles.white} numberOfLines={1}>
              {ticketMode ? t("v2.ticket.camera_hint") : t("v2.photo.camera_hint")}
            </Text>
          </View>
          <RoundButton
            icon={torch ? "flash" : "flash-outline"}
            label={t("v2.photo.light")}
            selected={torch}
            onPress={() => setTorch((v) => !v)}
          />
        </View>
        <View style={[styles.shutterBar, { bottom: insets.bottom + spacing.xxl }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("v2.photo.take")}
            onPress={shoot}
            disabled={shooting}
            style={styles.shutter}
          >
            {shooting ? <ActivityIndicator color={palette.volt} /> : <View style={styles.shutterDot} />}
          </Pressable>
        </View>
      </View>
    );
  } else if (ticketMode) {
    body = (
      <TicketResult
        stage={stage}
        endsAt={ticketEndsAt}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
        onRetake={retake}
        onUse={useTicket}
        onManual={byHand}
        onFree={useFree}
      />
    );
  } else {
    const reading = stage.kind === "reading";
    body = (
      <View style={[styles.fill, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.checkHead}>
          <Text variant="bodyStrong" style={styles.white} accessibilityRole="header">{t("v2.photo.check_title")}</Text>
          <Text variant="small" style={{ color: MUTED }}>{t("v2.photo.only_here")}</Text>
        </View>
        <View style={styles.preview}>
          <Image source={{ uri: stage.uri }} style={styles.fill} resizeMode="contain" accessibilityLabel={t("v2.photo.title")} />
          {reading ? (
            <View style={styles.reading}>
              <ActivityIndicator color={palette.volt} />
              <Text variant="smallStrong" style={styles.white}>{t("v2.photo.reading")}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.checkButtons}>
          <Pressable
            accessibilityRole="button"
            onPress={retake}
            disabled={reading}
            style={[styles.outline, reading && { opacity: 0.45 }]}
          >
            <Ionicons name="refresh" size={18} color={WHITE} />
            <Text variant="smallStrong" style={styles.white}>{t("v2.photo.retake")}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={save} disabled={reading} style={[styles.primary, { flex: 1 }]}>
            {reading ? (
              <ActivityIndicator color={palette.ink} />
            ) : (
              <Text variant="action" style={{ color: palette.ink }}>{t("v2.save.save").toUpperCase()}</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onBack} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root}>{body}</View>
    </Modal>
  );
}

/** Ticket: the photo + what was read (mockups T3 / K1–K4). */
function TicketResult({
  stage,
  endsAt,
  insetsTop,
  insetsBottom,
  onRetake,
  onUse,
  onManual,
  onFree,
}: {
  stage: Stage;
  endsAt: number | null;
  insetsTop: number;
  insetsBottom: number;
  onRetake: () => void;
  onUse: () => void;
  onManual: () => void;
  onFree: (entryAt: number, freeMinutes: number) => void;
}) {
  const { t } = useTranslation();
  /** Mall entry ticket: how long parking is free (M1). 2 h is the most common. */
  const [freeMin, setFreeMin] = useState(120);
  const [otherOpen, setOtherOpen] = useState(false);
  if (stage.kind !== "reading" && stage.kind !== "ticket") return null;
  const reading = stage.kind === "reading";
  const read = stage.kind === "ticket" ? stage.read : null;
  const now = Date.now();
  const valid = !!endsAt && endsAt > now;
  const units = { d: t("v2.units.d"), h: t("v2.units.h"), min: t("v2.units.min") };

  // Entry ticket: the free time counts from the entry printed on it, not from the photo.
  const entryAt = read?.kind === "entry" ? entryMoment(new Date(), read).getTime() : null;
  const freeEnd = entryAt ? entryAt + freeMin * 60_000 : null;
  const freeValid = !!freeEnd && freeEnd > now;

  let card: React.ReactNode = null;
  if (!reading && entryAt && freeEnd) {
    const at = freeEnd - remindBeforeFor(freeEnd) * 60_000;
    card = (
      <View style={[styles.card, { borderColor: freeValid ? palette.volt : palette.flare }]}>
        <Text variant="overline" style={{ color: MUTED }}>{t("v2.ticket.entry_at", { time: formatClock(entryAt) })}</Text>
        <Text variant="bodyStrong" style={styles.white}>{t("v2.ticket.free_q")}</Text>
        <View style={styles.pills}>
          {[60, 120, 180, 240].map((m) => (
            <DarkPill key={m} label={formatLimit(m, units)} selected={freeMin === m} onPress={() => setFreeMin(m)} />
          ))}
          <DarkPill
            chevron
            label={[60, 120, 180, 240].includes(freeMin) ? t("v2.save.other") : formatLimit(freeMin, units)}
            selected={![60, 120, 180, 240].includes(freeMin)}
            onPress={() => setOtherOpen(true)}
          />
        </View>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={16} color={freeValid ? palette.volt : palette.flare} />
          <Text variant="small" style={{ color: freeValid ? palette.textMid : palette.flare, flex: 1 }}>
            {freeValid
              ? t("v2.ticket.free_until", { end: formatEnd(freeEnd), at: formatClock(at) })
              : t("v2.ticket.free_over", { time: formatEnd(freeEnd) })}
          </Text>
        </View>
        <DurationSheet
          visible={otherOpen}
          initialMinutes={freeMin}
          minMinutes={0}
          subtitle={t("v2.ticket.free_q")}
          onCancel={() => setOtherOpen(false)}
          onDone={(m) => {
            setOtherOpen(false);
            setFreeMin(m);
          }}
        />
      </View>
    );
  } else if (!reading) {
    if (read?.kind === "end" && endsAt && valid) {
      const at = endsAt - remindBeforeFor(endsAt) * 60_000;
      card = (
        <View style={[styles.card, { borderColor: palette.volt }]}>
          <Text variant="overline" style={{ color: MUTED }}>
            {read.keyword ? t("v2.ticket.read_near", { word: read.keyword }) : t("v2.ticket.read_latest")}
          </Text>
          <View style={styles.until}>
            <Text variant="body" style={{ color: palette.textMid }}>{t("v2.ticket.valid_until")}</Text>
            <Text variant="title" style={{ color: palette.volt, fontSize: 34, lineHeight: 40 }}>{formatEnd(endsAt)}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={16} color={palette.volt} />
            <Text variant="small" style={{ color: palette.textMid, flex: 1 }}>
              {t("v2.ticket.left_remind", { left: formatDuration(endsAt - now, units), at: formatClock(at) })}
            </Text>
          </View>
        </View>
      );
    } else {
      // (An entry ticket is handled above.) Ended, or no time on it.
      const [title, text] =
        read?.kind === "end" && endsAt
          ? [t("v2.ticket.expired_title", { time: formatEnd(endsAt) }), t("v2.ticket.expired_text")]
          : [t("v2.ticket.none_title"), t("v2.ticket.none_text")];
      const warn = true;
      card = (
        <View style={[styles.card, { borderColor: warn ? palette.flare : palette.line, backgroundColor: warn ? "rgba(255,122,69,0.08)" : palette.carbon }]}>
          <Text variant="bodyStrong" style={{ color: warn ? palette.flare : WHITE }}>{title}</Text>
          <Text variant="small" style={{ color: palette.textMid }}>{text}</Text>
        </View>
      );
    }
  }

  return (
    <View style={[styles.fill, { paddingTop: insetsTop + spacing.md, paddingBottom: insetsBottom + spacing.xl }]}>
      <View style={styles.checkHead}>
        <Text variant="bodyStrong" style={styles.white} accessibilityRole="header">
          {read?.kind === "entry" ? t("v2.ticket.entry_head") : t("v2.ticket.check")}
        </Text>
        <Text variant="small" style={{ color: MUTED }}>{t("v2.ticket.not_kept")}</Text>
      </View>
      <View style={styles.preview}>
        <Image source={{ uri: stage.uri }} style={styles.fill} resizeMode="contain" accessibilityLabel={t("v2.ticket.ticket")} />
        {reading ? (
          <View style={styles.reading}>
            <ActivityIndicator color={palette.volt} />
            <Text variant="smallStrong" style={styles.white}>{t("v2.ticket.reading")}</Text>
          </View>
        ) : null}
      </View>
      {card}
      <View style={styles.checkButtons}>
        <Pressable accessibilityRole="button" onPress={onRetake} disabled={reading} style={[styles.outline, reading && { opacity: 0.45 }]}>
          <Ionicons name="refresh" size={18} color={WHITE} />
          <Text variant="smallStrong" style={styles.white}>{t("v2.photo.retake")}</Text>
        </Pressable>
        {entryAt ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onFree(entryAt, freeMin)}
            disabled={!freeValid}
            style={[styles.primary, { flex: 1 }, !freeValid && { opacity: 0.45 }]}
          >
            <Text variant="action" style={{ color: palette.ink }}>{t("v2.ticket.use").toUpperCase()}</Text>
          </Pressable>
        ) : valid && read?.kind === "end" ? (
          <Pressable accessibilityRole="button" onPress={onUse} style={[styles.primary, { flex: 1 }]}>
            <Text variant="action" style={{ color: palette.ink }}>{t("v2.ticket.use").toUpperCase()}</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={onManual} disabled={reading} style={[styles.outline, reading && { opacity: 0.45 }]}>
            <Text variant="smallStrong" style={styles.white}>{t("v2.ticket.set_by_hand")}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** A pill on the always-dark camera screens (same look in light and dark theme). */
function DarkPill({ label, selected, chevron, onPress }: { label: string; selected?: boolean; chevron?: boolean; onPress: () => void }) {
  const fg = selected ? palette.ink : palette.textMid;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[
        styles.darkPill,
        selected ? { backgroundColor: WHITE, borderColor: WHITE } : { borderColor: palette.line },
      ]}
    >
      <Text variant="smallStrong" style={{ color: fg }}>{label}</Text>
      {chevron ? <Ionicons name="chevron-down" size={14} color={fg} /> : null}
    </Pressable>
  );
}

function RoundButton({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      hitSlop={6}
      style={[styles.round, selected && { backgroundColor: palette.volt }]}
    >
      <Ionicons name={icon} size={22} color={selected ? palette.ink : WHITE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  fill: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.lg, paddingHorizontal: spacing.xxl },
  centerText: { textAlign: "center" },
  white: { color: WHITE },
  topBar: { position: "absolute", left: spacing.xl, right: spacing.xl, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(14,15,19,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  hintPill: {
    flex: 1,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: "rgba(14,15,19,0.7)",
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBar: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: palette.volt,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterDot: { width: 62, height: 62, borderRadius: 31, backgroundColor: WHITE },
  checkHead: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: 2 },
  preview: { flex: 1, marginHorizontal: spacing.xl, borderRadius: radius.xl, overflow: "hidden", backgroundColor: palette.carbon },
  reading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  card: { marginHorizontal: spacing.xl, marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1.5, gap: 6, backgroundColor: palette.carbon },
  until: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  darkPill: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkButtons: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  outline: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  primary: { height: 56, borderRadius: radius.pill, backgroundColor: palette.volt, alignItems: "center", justifyContent: "center" },
  textButton: { minHeight: 44, justifyContent: "center" },
});
