import { Platform } from "react-native";
import { EasySpotLocation } from "../modules/easyspot-location";
import { IosSensors } from "./ios-only";

/**
 * Barometer — Android: Kotlin SensorManager; iPhone: CMAltimeter (expo-sensors).
 * Used to show "Barometer: Yes/No" on Home and for "N floors below you" (domain/floors.ts).
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
  // CMAltimeter reports about once a second: if the window ends before the first
  // value, wait for it (up to 2 s more) instead of answering "no barometer".
  return new Promise((resolve) => {
    const values: number[] = [];
    let windowOver = false;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      sub.remove();
      clearTimeout(giveUp);
      values.sort((a, b) => a - b);
      resolve(values.length ? values[Math.floor(values.length / 2)] : null);
    };
    const sub = B.addListener((r) => {
      values.push(r.pressure);
      if (windowOver) finish();
    });
    setTimeout(() => {
      windowOver = true;
      if (values.length) finish();
    }, sampleMs);
    const giveUp = setTimeout(finish, sampleMs + 2000);
  });
}
