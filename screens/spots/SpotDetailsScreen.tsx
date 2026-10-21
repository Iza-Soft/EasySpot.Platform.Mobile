import { Ionicons } from "@expo/vector-icons";
import { zoneColorHex } from "../../domain/zone-color";
import { SpotPhotoCard } from "../../ui/SpotPhotoCard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { dayBucket, formatClock, formatDayMonth, formatDuration, formatEnd } from "../../domain/time";
import { useSpot } from "../../hook/useSpots";
import { RootStackParamList } from "../../navigation/types";
import { areaLine } from "../../services/geocoding";
import { getPreferredMap } from "../../services/map-preference-service";
import { openMapsAsync, shareSpotAsync } from "../../services/navigation-service";
import { deleteSpot, markViewed, spotName } from "../../services/spots-service";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/tokens";
import { AddressCard, AppHeader, Button, Card, IconButton, LevelTag, Text } from "../../ui";
import { ConfirmSheet } from "../../ui/ConfirmSheet";
import { Screen } from "../../ui/Screen";
import { displayLevel } from "../../domain/level";
import { usePrefs } from "../../state/prefs";

type Props = NativeStackScreenProps<RootStackParamList, "SpotDetails">;

/**
 * A finished parking or a favourite place (mockup C2), opened from Spots.
 * Active parkings open ParkedScreen instead.
 */
export default function SpotDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const spot = useSpot(id);
  const { levelLabels } = usePrefs();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const units = { d: t("v2.units.d"), h: t("v2.units.h"), min: t("v2.units.min") };

  // Opening a new favourite place ends its "New" mark.
  useEffect(() => {
    if (spot?.type === "favorites" && !spot.viewedAt) markViewed(db, spot.id).catch(() => undefined);
  }, [db, spot?.id, spot?.type, spot?.viewedAt]);

  if (!spot) return <Screen><View /></Screen>;

  const isParking = spot.type === "parking";
  const at = new Date(spot.timestamp).getTime();
  const day = dayBucket(at) === "today" ? null : formatDayMonth(at);
  const hasDetails = !!(spot.level || spot.section || spot.spot || spot.zoneColor);

  const navigate = async () => openMapsAsync({ latitude: spot.latitude, longitude: spot.longitude, map: await getPreferredMap() });
  const edit = () => navigation.navigate("SaveSpot", { id: spot.id, kind: spot.type });
  const doDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteSpot(db, spot.id);
      setConfirm(false);
      Toast.show({ type: "success", text1: t("v2.spots.deleted") });
      navigation.goBack();
    } catch {
      Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.errors.generic") });
      setDeleting(false);
    }
  };

  const parkedLine =
    isParking && spot.endedAt
      ? t("v2.details.range", { from: formatClock(at), to: formatClock(spot.endedAt), dur: formatDuration(spot.endedAt - at, units) })
      : formatClock(at);

  return (
    <Screen>
      <AppHeader title={isParking ? t("v2.details.title_parking") : t("v2.details.title_place")} />
      <View style={styles.header}>
        <IconButton accessibilityLabel={t("v2.common.back")} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </IconButton>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>{spot.title || (isParking ? t("v2.details.title_parking") : t("v2.details.title_place"))}</Text>
          <Text variant="small" tone="muted">
            {[day ?? t("v2.spots.today"), isParking ? t("v2.details.finished") : t("v2.details.title_place")].join(" · ")}
          </Text>
        </View>
      </View>

      <Card style={styles.spotCard}>
        {isParking && hasDetails ? (
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
        ) : !isParking ? (
          <LevelTag variant="outline" icon={<Ionicons name="star" size={18} color={colors.text} />} />
        ) : null}
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
      </Card>

      <SpotPhotoCard photo={spot.photoUri} />

      <Card style={styles.facts}>
        <Fact icon="time-outline" label={isParking ? t("v2.details.parked") : t("v2.details.saved")} value={parkedLine} />
        {isParking && spot.reminderEndsAt ? (
          <Fact
            icon="notifications-outline"
            label={t("v2.details.paid_time")}
            value={t("v2.details.limit_stopped", { time: formatEnd(spot.reminderEndsAt) })}
            muted
          />
        ) : null}
      </Card>

      <Button
        kind="primary"
        size="lg"
        label={t("v2.details.navigate")}
        icon={<Ionicons name="navigate" size={20} color={colors.onAccent} />}
        onPress={navigate}
        style={{ marginTop: spacing.sm }}
      />
      <View style={styles.row}>
        <Button style={{ flex: 1 }} label={t("v2.details.edit")} onPress={edit} />
        <Button style={{ flex: 1 }} label={t("v2.details.share")} onPress={() => shareSpotAsync(spot)} />
        <Button style={{ flex: 1 }} kind="ghost" label={t("v2.details.delete")} onPress={() => setConfirm(true)} />
      </View>

      <ConfirmSheet
        visible={confirm}
        title={t("v2.spots.delete_title")}
        message={t("v2.spots.delete_message")}
        confirmLabel={t("v2.spots.delete")}
        cancelLabel={t("common.cancel")}
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirm(false)}
        preview={
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="bodyStrong" numberOfLines={1}>{spotName(spot, t("v2.spots.street_parking"))}</Text>
            <Text variant="small" tone="muted" numberOfLines={1}>{parkedLine}</Text>
          </View>
        }
      />
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

function Fact({ icon, label, value, muted }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; muted?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text variant="body" style={{ flex: 1 }}>{label}</Text>
      <Text variant="bodyStrong" tone={muted ? "muted" : "default"} style={{ flexShrink: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  spotCard: { gap: spacing.md, borderRadius: radius.xxl, marginBottom: spacing.md },
  levelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  zoneCol: { gap: spacing.sm, paddingBottom: 6 },
  note: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", padding: spacing.md, borderRadius: radius.md },
  facts: { gap: spacing.md, marginBottom: spacing.md },
  fact: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 32 },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
});
