import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, SectionList, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { dayBucket, DayBucket, formatClock, formatDayMonth, formatDuration, formatEnd } from "../../domain/time";
import { getPreferredMap } from "../../services/map-preference-service";
import { openMapsAsync, ShareLocationAsync } from "../../services/navigation-service";
import { RootStackParamList } from "../../navigation/types";
import {
  deleteSpot,
  endParking,
  getActiveParkings,
  isNewPlace,
  listSpots,
  Spot,
  SpotKind,
  spotName,
} from "../../services/spots-service";
import { useNow } from "../../hook/useSpots";
import { canShowFloors, useLivePressure } from "../../hook/useFloorsToCar";
import { floorsAboveCar } from "../../domain/floors";
import { FloorsLine } from "../../ui/FloorsLine";
import { useSpotsVersion } from "../../state/spotsStore";
import { usePrefs } from "../../state/prefs";
import { displayLevel } from "../../domain/level";
import { useTheme } from "../../theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../../theme/tokens";
import { ActionSheet, AppHeader, LevelTag, Pill, SheetAction, Text, TimeBar } from "../../ui";
import { ConfirmSheet } from "../../ui/ConfirmSheet";
import { formatAddress } from "../../utils/address";

const PAGE = 40;
type Filter = SpotKind | "all";
type SectionKey = "active" | "new" | DayBucket;

/** Client-side search for the (few) active parkings, same fields as listSpots. */
const matches = (s: Spot, q: string) =>
  !q ||
  [s.title, s.street, s.city, s.level, s.section, s.spot, s.comments].some((v) => v?.toLocaleLowerCase().includes(q.toLocaleLowerCase()));

/**
 * Spots (mockup S1): ACTIVE parkings on top (Volt border, Find, paid time
 * bar), then NEW favourite places, then the history (grey border).
 * Tapping a row opens Parked (active) or Spot details; ⋯ opens quick actions.
 */
export default function SpotsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const version = useSpotsVersion();
  const now = useNow(30_000);
  const [actives, setActives] = useState<Spot[]>([]);
  // One live pressure reading for all active rows (mockup B4), only while Spots is in front.
  const focused = useIsFocused();
  const { levelLabels, floorsEnabled } = usePrefs();
  const pressure = useLivePressure(floorsEnabled && focused && actives.some((a) => canShowFloors(a, now)));
  const lastFloors = useRef<Record<number, number | null>>({});
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Spot[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Spot | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Spot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const loading = useRef(false);

  const load = useCallback(
    async (reset: boolean) => {
      if (loading.current) return;
      loading.current = true;
      try {
        const offset = reset ? 0 : items.length;
        const page = await listSpots(db, { search: query, type: filter, limit: PAGE, offset });
        if (reset) setActives(filter === "favorites" ? [] : (await getActiveParkings(db)).filter((s) => matches(s, query)));
        setItems((prev) => (reset ? page : [...prev, ...page]));
        setHasMore(page.length === PAGE);
      } catch (e) {
        console.error("listSpots failed:", e);
      } finally {
        loading.current = false;
        setLoaded(true);
      }
    },
    [db, filter, query, items.length],
  );

  // Reload on focus and (debounced) when the search/filter changes.
  const reloadRef = useRef(load);
  reloadRef.current = load;
  useFocusEffect(
    useCallback(() => {
      reloadRef.current(true);
    }, []),
  );
  useEffect(() => {
    const h = setTimeout(() => reloadRef.current(true), 250);
    return () => clearTimeout(h);
  }, [query, filter]);
  // Any save / edit / end / delete anywhere in the app.
  useEffect(() => {
    reloadRef.current(true);
  }, [version]);

  const sections = useMemo(() => {
    const activeIds = new Set(actives.map((a) => a.id));
    const map: Record<SectionKey, Spot[]> = { active: actives, new: [], today: [], week: [], earlier: [] };
    for (const s of items) {
      if (activeIds.has(s.id)) continue;
      if (isNewPlace(s, now)) map.new.push(s);
      else map[dayBucket(new Date(s.timestamp))].push(s);
    }
    const order: SectionKey[] = ["active", "new", "today", "week", "earlier"];
    return order
      .filter((k) => map[k].length)
      .map((k) => ({
        key: k,
        title: k === "active" ? `${t("v2.spots.active")} · ${map.active.length}` : t(`v2.spots.${k}`),
        data: map[k],
      }));
  }, [actives, items, now, t]);

  const isActive = (s: Spot) => actives.some((a) => a.id === s.id);
  const open = (s: Spot) => navigation.navigate(isActive(s) ? "Parked" : "SpotDetails", { id: s.id });
  const find = async (s: Spot) => openMapsAsync({ latitude: s.latitude, longitude: s.longitude, map: await getPreferredMap() });

  const actions: SheetAction[] = selected
    ? [
        {
          key: "nav",
          label: t("v2.spots.navigate"),
          icon: "navigate-outline",
          onPress: async () =>
            openMapsAsync({ latitude: selected.latitude, longitude: selected.longitude, map: await getPreferredMap() }),
        },
        {
          key: "share",
          label: t("v2.spots.share"),
          icon: "share-social-outline",
          onPress: () => ShareLocationAsync({ latitude: selected.latitude, longitude: selected.longitude }),
        },
        {
          key: "addr",
          label: t("v2.spots.copy_address"),
          icon: "copy-outline",
          onPress: async () => {
            const text = formatAddress({
              street: selected.street ?? undefined,
              city: selected.city ?? undefined,
              region: selected.region ?? undefined,
              postalCode: selected.postalCode ?? undefined,
              country: selected.country ?? undefined,
            });
            if (!text) return Toast.show({ type: "info", text1: t("v2.spots.no_address") });
            await Clipboard.setStringAsync(text);
            Toast.show({ type: "success", text1: t("v2.spots.copied") });
          },
        },
        {
          key: "coords",
          label: t("v2.spots.copy_coords"),
          icon: "locate-outline",
          onPress: async () => {
            await Clipboard.setStringAsync(`${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`);
            Toast.show({ type: "success", text1: t("v2.spots.copied") });
          },
        },
        ...(isActive(selected)
          ? [
              {
                key: "end",
                label: t("v2.parked.back"),
                icon: "flag-outline" as const,
                onPress: async () => {
                  try {
                    await endParking(db, selected.id);
                    Toast.show({ type: "success", text1: t("v2.parked.ended") });
                  } catch {
                    Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.errors.generic") });
                  }
                },
              },
            ]
          : []),
        {
          key: "delete",
          label: t("v2.spots.delete"),
          icon: "trash-outline",
          destructive: true,
          // Let the action sheet finish closing before the confirm sheet opens (iOS can't present two modals at once).
          onPress: () => setTimeout(() => setPendingDelete(selected), 300),
        },
      ]
    : [];

  const doDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteSpot(db, pendingDelete.id);
      setItems((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      setActives((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      setPendingDelete(null);
      Toast.show({ type: "success", text1: t("v2.spots.deleted") });
    } catch {
      Toast.show({ type: "error", text1: t("common.error"), text2: t("v2.errors.generic") });
    } finally {
      setDeleting(false);
    }
  };

  const tagFor = (item: Spot) =>
    item.type === "favorites" ? (
      <LevelTag variant="outline" icon={<Ionicons name="star" size={18} color={colors.text} />} />
    ) : item.level ? (
      <LevelTag value={displayLevel(item.level, levelLabels)} />
    ) : (
      <LevelTag value="P" variant="muted" />
    );

  const meta = (s: Spot) => {
    const at = new Date(s.timestamp);
    const when = dayBucket(at) === "today" ? formatClock(at) : `${formatDayMonth(at)} ${formatClock(at)}`;
    const place = [s.section, s.spot].filter(Boolean).join("");
    const dur =
      s.type === "parking" && s.endedAt
        ? formatDuration(s.endedAt - at.getTime(), { d: t("v2.units.d"), h: t("v2.units.h"), min: t("v2.units.min") })
        : null;
    return [place || null, when, dur].filter(Boolean).join(" · ");
  };

  const empty = loaded && items.length === 0 && actives.length === 0;
  const units = { d: t("v2.units.d"), h: t("v2.units.h"), min: t("v2.units.min") };

  const moreButton = (item: Spot) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("v2.spots.more")}
      onPress={() => setSelected(item)}
      hitSlop={6}
      style={styles.more}
    >
      <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
    </Pressable>
  );

  const badge = (label: string, color: string) => (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text variant="smallStrong" style={[styles.badgeText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );

  const renderActive = (item: Spot) => {
    const parkedAt = new Date(item.timestamp).getTime();
    const ends = item.reminderActive && item.reminderEndsAt ? item.reminderEndsAt : null;
    const expired = !!ends && ends <= now;
    const total = ends ? Math.max(1, ends - (item.reminderStartedAt ?? parkedAt)) : 1;
    const floors = floorsEnabled
      ? floorsAboveCar(item.parkPressureHPa, pressure, parkedAt, Date.now(), lastFloors.current[item.id])
      : null;
    lastFloors.current[item.id] = floors;
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => open(item)}
        style={({ pressed }) => [
          styles.row,
          styles.activeRow,
          { backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderColor: expired ? colors.alert : colors.accentFg },
        ]}
      >
        <View style={styles.rowTop}>
          {tagFor(item)}
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={styles.badgeLine}>
              {badge(t("v2.spots.now"), colors.accentFg)}
              <Text variant="small" tone="muted" numberOfLines={1}>{t("v2.spots.since", { time: formatClock(parkedAt) })}</Text>
            </View>
            <Text variant="bodyStrong" numberOfLines={1}>{spotName(item, t("v2.spots.street_parking"))}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => find(item)}
            style={({ pressed }) => [styles.find, { backgroundColor: pressed ? colors.accentPressed : colors.accent }]}
          >
            <Ionicons name="navigate" size={15} color={colors.onAccent} />
            <Text variant="smallStrong" tone="onAccent">{t("v2.spots.find")}</Text>
          </Pressable>
          {moreButton(item)}
        </View>
        {ends ? (
          <>
            <TimeBar fraction={(ends - now) / total} expired={expired} />
            <View style={styles.between}>
              <Text variant="smallStrong" tone={expired || (ends - now) / total < 0.15 ? "alert" : "level"} numberOfLines={1}>
                {expired ? t("v2.parked.expired") : t("v2.parked.left_long", { d: formatDuration(ends - now, units) })}
              </Text>
              <Text variant="small" tone="muted" numberOfLines={1}>
                {expired ? t("v2.parked.ended_at", { time: formatEnd(ends) }) : t("v2.parked.until_short", { time: formatEnd(ends) })}
              </Text>
            </View>
          </>
        ) : null}
        {floors != null ? <FloorsLine floors={floors} compact /> : null}
      </Pressable>
    );
  };

  const renderRow = (item: Spot, isNew: boolean) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => open(item)}
      style={({ pressed }) => [
        styles.row,
        styles.rowTop,
        isNew && styles.activeRow,
        {
          backgroundColor: pressed ? colors.surfaceRaised : isNew ? colors.surface : colors.backgroundDeep,
          borderColor: isNew ? colors.accentFg : colors.border,
        },
      ]}
    >
      {tagFor(item)}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {isNew ? (
          <View style={styles.badgeLine}>
            {badge(t("v2.spots.new"), colors.accentFg)}
            <Text variant="small" tone="muted" numberOfLines={1}>{t("v2.spots.favorite")}</Text>
          </View>
        ) : null}
        <Text variant="bodyStrong" tone={isNew ? "default" : "secondary"} numberOfLines={1}>{spotName(item, t("v2.spots.street_parking"))}</Text>
        {!isNew ? <Text variant="small" tone="muted" numberOfLines={1}>{meta(item)}</Text> : null}
      </View>
      {moreButton(item)}
    </Pressable>
  );

  return (
    <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.top}>
        <AppHeader title={t("v2.tabs.spots")} />
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("v2.spots.search")}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accentFg}
            accessibilityLabel={t("v2.spots.search")}
            style={[styles.searchInput, { color: colors.text, fontFamily: fontFamily.regular }]}
            returnKeyType="search"
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t("common.close")} onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.filters}>
          <Pill label={t("v2.spots.all")} selected={filter === "all"} onPress={() => setFilter("all")} />
          <Pill label={t("v2.spots.parked")} selected={filter === "parking"} onPress={() => setFilter("parking")} />
          <Pill label={t("v2.spots.places")} selected={filter === "favorites"} onPress={() => setFilter("favorites")} />
        </View>
      </View>

      {empty ? (
        <View style={styles.empty}>
          <Ionicons name="car-outline" size={48} color={colors.textMuted} />
          <Text variant="heading" style={{ textAlign: "center" }}>
            {query ? t("v2.spots.no_results") : t("v2.spots.empty")}
          </Text>
          {!query ? <Text variant="body" tone="muted" style={{ textAlign: "center" }}>{t("v2.spots.empty_hint")}</Text> : null}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && load(false)}
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section }) => (
            <Text variant="overline" tone={section.key === "active" ? "level" : "muted"} style={styles.sectionHeader}>
              {section.title}
            </Text>
          )}
          renderItem={({ item, section }) =>
            section.key === "active" ? renderActive(item) : renderRow(item, section.key === "new")
          }
        />
      )}

      <ActionSheet
        visible={!!selected}
        title={selected ? spotName(selected, t("v2.spots.street_parking")) : undefined}
        subtitle={selected ? meta(selected) : undefined}
        actions={actions}
        onClose={() => setSelected(null)}
      />

      <ConfirmSheet
        visible={!!pendingDelete}
        title={t("v2.spots.delete_title")}
        message={t("v2.spots.delete_message")}
        confirmLabel={t("v2.spots.delete")}
        cancelLabel={t("common.cancel")}
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setPendingDelete(null)}
        preview={
          pendingDelete ? (
            <>
              {tagFor(pendingDelete)}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="bodyStrong" numberOfLines={1}>{spotName(pendingDelete, t("v2.spots.street_parking"))}</Text>
                <Text variant="small" tone="muted" numberOfLines={1}>{meta(pendingDelete)}</Text>
              </View>
            </>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.sm },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  filters: { flexDirection: "row", gap: spacing.xs },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xs },
  sectionHeader: { marginTop: spacing.md, marginBottom: spacing.xs },
  row: {
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  activeRow: { borderWidth: 1.5, borderRadius: radius.xl },
  badgeLine: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  badge: { height: 20, paddingHorizontal: 7, borderRadius: 999, borderWidth: 1, justifyContent: "center" },
  badgeText: { fontSize: 10, lineHeight: 12, letterSpacing: 1 },
  find: { flexDirection: "row", alignItems: "center", gap: 6, height: 40, paddingHorizontal: spacing.md, borderRadius: 999 },
  more: { width: 40, height: 44, alignItems: "center", justifyContent: "center" },
  between: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, paddingHorizontal: spacing.xxl },
});
