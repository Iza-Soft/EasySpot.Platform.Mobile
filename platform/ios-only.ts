/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from "react-native";
import type * as NotificationsT from "expo-notifications";
import type * as LocationT from "expo-location";
import type * as SensorsT from "expo-sensors";

/**
 * Libraries used ONLY in the iPhone build. On Android their native parts are not
 * even compiled in (package.json → expo.autolinking.android.exclude): there the
 * same jobs are done by our Kotlin code — reminders (ParkingModule), location,
 * address and barometer (modules/easyspot-location). That also drops Firebase
 * (pulled in by expo-notifications), which EasySpot never used.
 * Loaded lazily, so Android never runs their JS either.
 */
export const IosNotifications: typeof NotificationsT | null =
  Platform.OS === "ios" ? require("expo-notifications") : null;

export const IosLocation: typeof LocationT | null = Platform.OS === "ios" ? require("expo-location") : null;

export const IosSensors: typeof SensorsT | null = Platform.OS === "ios" ? require("expo-sensors") : null;

export type { NotificationsT };
