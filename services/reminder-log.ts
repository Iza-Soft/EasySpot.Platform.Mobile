import AsyncStorage from "@react-native-async-storage/async-storage";
import { IosNotifications, NotificationsT } from "../platform/ios-only";
import { Platform } from "react-native";
import ParkingNativeService from "../native/ParkingModule";

/**
 * History of delivered reminders (Reminders screen, mockup W4): when each one was
 * due and when it actually came, plus the phone's state at that moment.
 *  Android — written by Kotlin (ParkingReceiver) the moment it arrives, even with the
 *            app closed and the phone locked.
 *  iPhone  — iOS runs no app code when a notification arrives, so it is read later:
 *            from Notification Center (still there) or when it is tapped / arrives
 *            while EasySpot is open. One swiped away unseen is not listed.
 */
export interface LogEntry {
  key: string;
  title: string;
  test: boolean;
  plannedAt: number;
  cameAt: number;
  /** Android only. */
  screenOff?: boolean;
  locked?: boolean;
  powerSave?: boolean;
  idle?: boolean;
}

/** More than this after the planned time = "Late". */
export const LATE_AFTER_MS = 60_000;
const MAX = 30;
const IOS_KEY = "@reminder_log_ios";

export const isLate = (e: LogEntry) => e.cameAt - e.plannedAt > LATE_AFTER_MS;

export async function getReminderLog(): Promise<LogEntry[]> {
  if (Platform.OS === "android") {
    try {
      const raw = JSON.parse(await ParkingNativeService.getReminderLog()) as Omit<LogEntry, "key">[];
      return raw.map((e, i) => ({ ...e, key: `${e.cameAt}-${i}` }));
    } catch {
      return [];
    }
  }
  await collectIosPresented();
  return readIos();
}

export async function clearReminderLog(): Promise<void> {
  if (Platform.OS === "android") return ParkingNativeService.clearReminderLog();
  await AsyncStorage.removeItem(IOS_KEY);
}

// ── iPhone ──────────────────────────────────────────────────────────────

async function readIos(): Promise<LogEntry[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(IOS_KEY)) ?? "[]");
  } catch {
    return [];
  }
}

/** Adds an iOS notification to the history (once; keyed by id + delivery time). */
export async function logIosNotification(n: NotificationsT.Notification): Promise<void> {
  const data = n.request.content.data as Record<string, unknown> | undefined;
  const plannedAt = Number(data?.plannedAt);
  if (!plannedAt || (data?.type !== "parking_reminder" && data?.type !== "test")) return;
  // Delivery time (ms; older iOS bridges gave seconds).
  const raw = typeof n.date === "number" && n.date > 0 ? n.date : Date.now();
  const cameAt = raw < 1e12 ? raw * 1000 : raw;
  const key = `${n.request.identifier}-${cameAt}`;
  const list = await readIos();
  if (list.some((e) => e.key === key)) return;
  const entry: LogEntry = {
    key,
    title: typeof data?.spotTitle === "string" ? data.spotTitle : "",
    test: data?.type === "test",
    plannedAt,
    cameAt,
  };
  const next = [entry, ...list].sort((a, b) => b.cameAt - a.cameAt).slice(0, MAX);
  await AsyncStorage.setItem(IOS_KEY, JSON.stringify(next));
}

async function collectIosPresented() {
  try {
    for (const n of (await IosNotifications?.getPresentedNotificationsAsync()) ?? []) await logIosNotification(n);
  } catch {
    // nothing to add
  }
}

/** iPhone: also catch reminders that arrive while EasySpot is open or are tapped. Call once at start. */
export function watchIosReminders(): () => void {
  const Notifications = IosNotifications;
  if (Platform.OS !== "ios" || !Notifications) return () => undefined;
  const a = Notifications.addNotificationReceivedListener((n) => void logIosNotification(n));
  const b = Notifications.addNotificationResponseReceivedListener((r) => void logIosNotification(r.notification));
  return () => {
    a.remove();
    b.remove();
  };
}
