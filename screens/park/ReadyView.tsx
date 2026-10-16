import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { useHere } from "../../hook/useSpots";
import { RootStackParamList } from "../../navigation/types";
import { EasySpotLocation } from "../../modules/easyspot-location";
import { getEcosystem } from "../../platform/services";
import { hasBarometer } from "../../platform/barometer";
import { ShareLocationAsync } from "../../services/navigation-service";
import { SpotKind } from "../../services/spots-service";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { AppHeader, Button, StatTile, Text } from "../../ui";
import { Screen } from "../../ui/Screen";
import { DebugAddressSheet } from "./DebugAddressSheet";
import { ParkButton } from "./ParkButton";
import { RemindersBanner } from "./RemindersBanner";
import { useReminderReadiness } from "../../state/remindersStore";

/** Home when nothing is parked: where you are + the big PARK button. */
export function ReadyView({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { here, refresh, refreshing } = useHere(true);
  const [busy, setBusy] = useState<"share" | null>(null);
  const [barometer, setBarometer] = useState<boolean | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const readiness = useReminderReadiness();


  useEffect(() => {
    // Android: Kotlin SensorManager; iOS: CMAltimeter (platform/barometer.ts).
    hasBarometer().then(setBarometer).catch(() => setBarometer(false));
  }, []);

  // Opens the Save sheet right away; it finds the location and saves only when the user confirms.
  const save = (kind: SpotKind) => {
    Haptics.selectionAsync().catch(() => undefined);
    navigation.navigate("SaveSpot", { kind });
  };

  const share = async () => {
    if (busy) return;
    setBusy("share");
    try {
      await ShareLocationAsync();
    } catch {
      Toast.show({ type: "error", text1: t("common.error"), text2: t("main.errors.share_failed") });
    } finally {
      setBusy(null);
    }
  };

  const accuracy = here.status === "ok" ? here.accuracy : null;
  const gpsCaption =
    accuracy == null ? undefined : accuracy <= 15 ? t("v2.park.gps_good") : accuracy <= 50 ? t("v2.park.gps_fair") : t("v2.park.gps_weak");

  return (
    <Screen>
      {/* Dev builds: long-press the logo → address test for other countries. */}
      <AppHeader title={t("v2.screens.home")} onLogoLongPress={__DEV__ ? () => setDebugOpen(true) : undefined} />

      <Pressable
        accessibilityRole="button"
        accessibilityHint={t("v2.park.refresh_location")}
        onPress={refresh}
        style={styles.where}
      >
        <View style={styles.whereText}>
          <Text variant="overline" tone="muted">{t("v2.park.youre_in")}</Text>
          {here.status === "loading" && <Text variant="heading" tone="secondary">{t("v2.park.locating")}</Text>}
          {here.status === "error" && (
            <>
              <Text variant="heading">{t("v2.park.no_location")}</Text>
              <Text variant="small" tone="muted">{t("v2.park.no_location_hint")}</Text>
            </>
          )}
          {here.status === "ok" && (
            <>
              {/* The area, not the exact address: that one is in the Save sheet, measured fresh. */}
              <Text variant="heading" numberOfLines={2}>{here.area ?? t("v2.park.location_found")}</Text>
              {here.city ? <Text variant="body" tone="muted" numberOfLines={2}>{here.city}</Text> : null}
            </>
          )}
        </View>
        <View
          accessibilityLabel={t("v2.park.refresh_location")}
          style={[styles.locate, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {refreshing ? (
            <ActivityIndicator color={colors.accentFg} />
          ) : (
            <Ionicons name="locate" size={22} color={colors.accentFg} />
          )}
        </View>
      </Pressable>

      <RemindersBanner readiness={readiness} onPress={() => navigation.navigate("Reminders")} />

      <View style={[styles.center, !readiness.ready && readiness.loaded && styles.centerTight]}>
        <ParkButton onPress={() => save("parking")} />
      </View>

      <View style={styles.tiles}>
        <StatTile label={t("v2.park.gps")} value={accuracy != null ? `±${Math.round(accuracy)} m` : "—"} caption={gpsCaption} />
        <StatTile
          label={t("v2.park.barometer")}
          value={barometer == null ? "…" : barometer ? t("v2.park.barometer_yes") : t("v2.park.barometer_no")}
          caption={t("v2.park.barometer_caption")}
          highlight={!!barometer}
        />
        <StatTile label={t("v2.park.services")} value={t(`v2.eco.${getEcosystem()}`)} caption={t("v2.park.services_caption")} />
      </View>

      <View style={styles.actions}>
        <Button
          style={{ flex: 1 }}
          label={t("v2.park.favorite_place")}
          icon={<Ionicons name="star-outline" size={18} color={colors.accentFg} />}
          onPress={() => save("favorites")}
        />
        <Button
          style={{ flex: 1 }}
          label={t("v2.park.share_location")}
          loading={busy === "share"}
          icon={<Ionicons name="share-social-outline" size={18} color={colors.accentFg} />}
          onPress={share}
        />
      </View>
      {__DEV__ ? <DebugAddressSheet visible={debugOpen} onClose={() => setDebugOpen(false)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  where: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 72 },
  whereText: { flex: 1, gap: 2 },
  locate: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", marginVertical: spacing.xl },
  centerTight: { marginTop: spacing.md, marginBottom: spacing.lg },
  tiles: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm },
});
