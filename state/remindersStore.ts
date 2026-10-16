import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";
import { AppState, Linking, PermissionsAndroid, Platform } from "react-native";
import { EasySpotLocation, ReminderSetting } from "../modules/easyspot-location";
import { IosNotifications } from "../platform/ios-only";

/**
 * Is this phone ready to deliver the parking reminder on time? (mockups W1–W3)
 * One shared state for Home (banner), Settings (row chip) and the Reminders screen.
 * Rechecked whenever the app comes back to the foreground — e.g. after Fix.
 */
export type StepKey = "notifications" | "exactAlarms" | "battery" | "launch";

export interface ReminderStep {
  key: StepKey;
  ok: boolean;
  /** The phone does not report it — the user confirms it ("I did it"). */
  manual?: boolean;
}

export interface Readiness {
  loaded: boolean;
  steps: ReminderStep[];
  oem: "huawei" | "xiaomi" | null;
  batteryPage: "appInfo" | "list";
  done: number;
  total: number;
  ready: boolean;
}

const LAUNCH_KEY = "@reminders_launch_confirmed";

let state: Readiness = { loaded: false, steps: [], oem: null, batteryPage: "appInfo", done: 0, total: 0, ready: true };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function notificationsAllowed(): Promise<boolean> {
  if (Platform.OS === "ios") {
    // Granted AND shown as an alert (banner / lock screen) — "quiet" delivery would miss the point.
    const p = await IosNotifications!.getPermissionsAsync();
    return p.granted && p.ios?.allowsAlert !== false;
  }
  if (Number(Platform.Version) >= 33) {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (!granted) return false;
  }
  return EasySpotLocation?.getReminderStatus?.().notifications ?? true;
}

export async function refreshReadiness(): Promise<Readiness> {
  const steps: ReminderStep[] = [];
  let oem: Readiness["oem"] = null;
  let batteryPage: Readiness["batteryPage"] = "appInfo";
  try {
    steps.push({ key: "notifications", ok: await notificationsAllowed() });
    const st = Platform.OS === "android" ? EasySpotLocation?.getReminderStatus?.() : undefined;
    if (st) {
      if (st.sdkInt >= 31) steps.push({ key: "exactAlarms", ok: st.exactAlarms });
      steps.push({ key: "battery", ok: st.battery });
      oem = st.oem;
      batteryPage = st.batteryPage;
      if (st.oem) steps.push({ key: "launch", ok: (await AsyncStorage.getItem(LAUNCH_KEY)) === "1", manual: true });
    }
  } catch (e) {
    console.warn("reminder readiness check failed:", e);
  }
  const done = steps.filter((s) => s.ok).length;
  state = { loaded: true, steps, oem, batteryPage, done, total: steps.length, ready: done === steps.length };
  emit();
  return state;
}

/** What would stop THIS reminder (X1/X2): notifications off wins over exact time off; null = it arrives on time. */
export function warningKey(r: Readiness): "notifications" | "exactAlarms" | null {
  if (!r.loaded) return null;
  const off = (k: StepKey) => r.steps.some((s) => s.key === k && !s.ok);
  return off("notifications") ? "notifications" : off("exactAlarms") ? "exactAlarms" : null;
}

export function getReadiness() {
  return state;
}

/** Live readiness; rechecks on mount and every time the app becomes active. */
export function useReminderReadiness(): Readiness {
  const snap = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
  useEffect(() => {
    refreshReadiness();
    const sub = AppState.addEventListener("change", (s) => s === "active" && refreshReadiness());
    return () => sub.remove();
  }, []);
  return snap;
}

/** Fix one step: ask in-app where possible, otherwise open the exact system page. */
export async function fixStep(key: StepKey): Promise<void> {
  if (key === "notifications") {
    if (Platform.OS === "ios") {
      const r = await IosNotifications!.requestPermissionsAsync();
      if (!r.granted && !r.canAskAgain) await Linking.openSettings();
    } else if (Number(Platform.Version) >= 33 && !(await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS))) {
      const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (r === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) openSystem("notifications");
    } else {
      openSystem("notifications"); // allowed for the app, but the reminder channel is muted
    }
    await refreshReadiness();
    return;
  }
  openSystem(key);
}

function openSystem(kind: ReminderSetting) {
  if (!EasySpotLocation?.openReminderSetting?.(kind)) Linking.openSettings().catch(() => undefined);
}

/** Huawei "App launch" / Xiaomi "Autostart": the user confirms it once. */
export async function confirmLaunchStep(): Promise<void> {
  await AsyncStorage.setItem(LAUNCH_KEY, "1");
  await refreshReadiness();
}
