import AsyncStorage from "@react-native-async-storage/async-storage";
import { PermissionsAndroid, Platform } from "react-native";
import { EasySpotLocation } from "../modules/easyspot-location";
import { IosLocation } from "./ios-only";

export interface Fix {
  latitude: number;
  longitude: number;
  /** metres, 68% confidence */
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
  source: "android" | "expo" | "ios";
}

const TIMEOUT_MS = 15_000;

/**
 * One call for "where am I right now", on every platform — always the best
 * engine the phone already has, chosen in native code:
 *  Android → EasySpotLocation (Kotlin): Google's fused engine when the phone
 *    has Google Play services, otherwise the system LocationManager (GPS,
 *    network, system fused on Android 12+) — the Huawei path.
 *  iOS → Core Location (expo-location — iPhone only; Swift module planned).
 * fresh: true when the fix will be SAVED (Save sheet) — a remembered fix is
 * reused only if it is ≤ 15 m. Home uses the fast default.
 * expo-location is not in the Android build at all (permission below).
 */
export async function getCurrentFix(opts: { fresh?: boolean } = {}): Promise<Fix> {
  const fresh = !!opts.fresh;
  if (Platform.OS === "android") {
    if (!EasySpotLocation) throw new Error("Location module missing (old native build)");
    return fromNative(await EasySpotLocation.getCurrentPositionAsync(TIMEOUT_MS, fresh));
  }

  // iOS: Core Location's getCurrentPosition always measures a new fix.
  const Location = IosLocation!;
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    altitude: loc.coords.altitude,
    timestamp: loc.timestamp,
    source: Platform.OS === "ios" ? "ios" : "expo",
  };
}

function fromNative(f: {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;
}): Fix {
  return { ...f, source: "android" };
}

const ASKED_KEY = "@location_permission_asked";

/**
 * Location permission (the system "Allow EasySpot to access location?").
 *  "ask"            — PARK: ask whenever it is not granted (the user just tapped).
 *  "ifNeverAsked"   — Home on open: ask only the very first time, never nag.
 * Android: React Native's PermissionsAndroid (system API, no library); fine OR
 * coarse location is enough. iPhone: Core Location via expo-location.
 */
export async function ensureLocationPermission(mode: "ask" | "ifNeverAsked"): Promise<boolean> {
  if (Platform.OS === "android") {
    const P = PermissionsAndroid.PERMISSIONS;
    if ((await PermissionsAndroid.check(P.ACCESS_FINE_LOCATION)) || (await PermissionsAndroid.check(P.ACCESS_COARSE_LOCATION))) {
      return true;
    }
    if (mode === "ifNeverAsked" && (await AsyncStorage.getItem(ASKED_KEY).catch(() => null)) === "1") return false;
    const r = await PermissionsAndroid.requestMultiple([P.ACCESS_FINE_LOCATION, P.ACCESS_COARSE_LOCATION]);
    await AsyncStorage.setItem(ASKED_KEY, "1").catch(() => undefined);
    const G = PermissionsAndroid.RESULTS.GRANTED;
    return r[P.ACCESS_FINE_LOCATION] === G || r[P.ACCESS_COARSE_LOCATION] === G;
  }
  const Location = IosLocation;
  if (!Location) return false;
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === "granted") return true;
  if (mode === "ifNeverAsked" && status !== "undetermined") return false;
  return (await Location.requestForegroundPermissionsAsync()).status === "granted";
}
