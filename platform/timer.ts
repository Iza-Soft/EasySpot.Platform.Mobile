import { IosNotifications } from "./ios-only";
import { Platform } from "react-native";
import ParkingNativeService from "../native/ParkingModule";
import { REMINDERS_URL, spotUrl } from "../navigation/linking";
import i18n from "../i18n";

/**
 * Parking-time reminders on every platform.
 *  Android (GMS + Huawei): the existing native AlarmManager module — no
 *    Firebase/FCM/HMS Push involved, so it behaves the same on Huawei.
 *  iOS: a local UNNotification scheduled through expo-notifications
 *    (iOS delivers scheduled local notifications reliably; no background
 *    execution needed).
 * 1.x only scheduled on Android, so iPhone users got no reminder at all.
 */
export interface ReminderRequest {
  locationId: number;
  title: string;
  /** Unix ms when the parking time ends (e.g. from Ticket Scan). */
  endsAt: number;
  remindBeforeMinutes: number;
}

const iosId = (locationId: number) => `parking-${locationId}`;

export async function scheduleParkingReminder(r: ReminderRequest): Promise<boolean> {
  const fireAt = r.endsAt - r.remindBeforeMinutes * 60_000;
  if (fireAt <= Date.now()) return false;

  if (Platform.OS === "android") {
    const minutesLeft = Math.ceil((r.endsAt - Date.now()) / 60_000);
    return ParkingNativeService.scheduleReminder(r.locationId, r.title, minutesLeft, r.remindBeforeMinutes);
  }

  const Notifications = IosNotifications;
  if (!Notifications) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;
  await Notifications.cancelScheduledNotificationAsync(iosId(r.locationId)).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: iosId(r.locationId),
    content: {
      // Same text as the Android notification (parking_strings.xml), in the app language.
      title: i18n.t("v2.reminders.notif_title"),
      body: i18n.t("v2.reminders.notif_body", { title: r.title, n: r.remindBeforeMinutes }),
      sound: true,
      // iOS 15+: shown even in a Focus mode (needs the time-sensitive entitlement in app.config.ts).
      interruptionLevel: "timeSensitive",
      // plannedAt + spotTitle: for the history on the Reminders screen (services/reminder-log.ts).
      data: { locationId: r.locationId, type: "parking_reminder", url: spotUrl(r.locationId), plannedAt: fireAt, spotTitle: r.title },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireAt) },
  });
  return true;
}

export async function cancelParkingReminder(locationId: number): Promise<void> {
  if (Platform.OS === "android") {
    await ParkingNativeService.cancelReminder(locationId);
    return;
  }
  const Notifications = IosNotifications;
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(iosId(locationId)).catch(() => undefined);
  // Already shown? Remove it too — no reminder for a deleted / ended parking.
  await Notifications.dismissNotificationAsync(iosId(locationId)).catch(() => undefined);
}

/** "Send a test reminder" (Reminders screen): arrives in `seconds` through the real reminder path. */
export async function sendTestReminder(seconds: number, title: string, body: string): Promise<boolean> {
  if (Platform.OS === "android") return ParkingNativeService.scheduleTestReminder(seconds);
  const Notifications = IosNotifications;
  if (!Notifications) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;
  await Notifications.scheduleNotificationAsync({
    identifier: "easyspot-test",
    content: {
      title,
      body,
      sound: true,
      interruptionLevel: "timeSensitive",
      data: { type: "test", url: REMINDERS_URL, plannedAt: Date.now() + seconds * 1000 },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
  return true;
}
