import { Platform } from "react-native";
import { EasySpotLocation } from "../modules/easyspot-location";
import { IosSensors } from "./ios-only";

/**
 * Barometer — Android: Kotlin SensorManager; iPhone: CMAltimeter (expo-sensors).
 * Used to show "Barometer: Yes/No" on Home and, in stage 2, to suggest the level.
 */
export async function hasBarometer(): Promise<boolean> {
  if (Platform.OS === "android") return !!EasySpotLocation?.getServicesInfo().hasBarometer;
  return (await IosSensors?.Barometer.isAvailableAsync().catch(() => false)) ?? false;
}

/** Air pressure in hPa (median over `sampleMs`), or null without a barometer. */
export async function readPressure(sampleMs = 1500): Promise<number | null> {
  if (Platform.OS === "android") return (await EasySpotLocation?.getPressureAsync(sampleMs).catch(() => null)) ?? null;
  const B = IosSensors?.Barometer;
  if (!B || !(await B.isAvailableAsync().catch(() => false))) return null;
  return new Promise((resolve) => {
    const values: number[] = [];
    const sub = B.addListener((r) => values.push(r.pressure));
    setTimeout(() => {
      sub.remove();
      values.sort((a, b) => a - b);
      resolve(values.length ? values[Math.floor(values.length / 2)] : null);
    }, sampleMs);
  });
}
