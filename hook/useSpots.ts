import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { ensureLocationPermission, getCurrentFix } from "../platform/location";
import { reverseGeocode } from "../services/geocoding";
import { publishHere, publishHereError, useHereState } from "../state/hereStore";
import { countActiveParkings, getSpot, Spot } from "../services/spots-service";
import { useSpotsVersion } from "../state/spotsStore";

export type { HereState } from "../state/hereStore";

/**
 * Where the user is now (area + GPS accuracy), refreshed on focus.
 * The value lives in state/hereStore, shared with the Save sheet.
 */
export function useHere(enabled: boolean) {
  const here = useHereState();
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setRefreshing(true);
    try {
      if (!(await ensureLocationPermission("ifNeverAsked"))) {
        publishHereError();
        return;
      }
      const fix = await getCurrentFix();
      publishHere(fix, await reverseGeocode(fix.latitude, fix.longitude));
    } catch (e) {
      console.warn("useHere failed:", e);
      publishHereError();
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (enabled) refresh();
    }, [enabled, refresh]),
  );

  return { here, refresh, refreshing };
}

/** Re-renders every `ms` so countdowns stay current. */
export function useNow(ms = 30_000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** One spot by id, reloaded whenever any spot changes (edit, +30 min, end). */
export function useSpot(id: number) {
  const db = useSQLiteContext();
  const version = useSpotsVersion();
  const [spot, setSpot] = useState<Spot | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    getSpot(db, id)
      .then((s) => alive && setSpot(s))
      .catch((e) => console.error("getSpot failed:", e));
    return () => {
      alive = false;
    };
  }, [db, id, version]);
  return spot;
}

/** Number of active parkings — the badge on the Spots tab. */
export function useActiveParkingCount() {
  const db = useSQLiteContext();
  const version = useSpotsVersion();
  const now = useNow(60_000);
  const [n, setN] = useState(0);
  useEffect(() => {
    countActiveParkings(db, now).then(setN).catch(() => undefined);
  }, [db, version, now]);
  return n;
}
