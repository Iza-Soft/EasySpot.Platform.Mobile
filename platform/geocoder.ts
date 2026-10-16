import { Platform } from "react-native";
import { EasySpotLocation, NativeAddress } from "../modules/easyspot-location";
import { IosLocation } from "./ios-only";

export type DeviceAddress = Partial<NativeAddress>;

const TIMEOUT_MS = 12_000;

/**
 * The phone's own geocoder (no external service):
 *  Android — Kotlin (android.location.Geocoder), Google / microG / Huawei behind it;
 *  iPhone  — Core Location (expo-location).
 * Throws when there is no geocoder or it does not answer in time
 * (services/geocoding.ts then retries later with a back-off).
 */
export async function deviceReverseGeocode(latitude: number, longitude: number): Promise<DeviceAddress | null> {
  let call: Promise<DeviceAddress[]>;
  if (Platform.OS === "android") {
    if (!EasySpotLocation?.reverseGeocodeAsync) throw new Error("Geocoder module missing (old native build)");
    call = EasySpotLocation.reverseGeocodeAsync(latitude, longitude);
  } else if (IosLocation) {
    call = IosLocation.reverseGeocodeAsync({ latitude, longitude }) as Promise<DeviceAddress[]>;
  } else {
    return null;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Geocoder did not answer in time")), TIMEOUT_MS);
  });
  try {
    const [a] = await Promise.race([call, timeout]);
    return a ?? null;
  } finally {
    clearTimeout(timer);
  }
}
