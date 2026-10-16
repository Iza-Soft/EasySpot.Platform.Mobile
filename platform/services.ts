import { Platform } from "react-native";
import { EasySpotLocation } from "../modules/easyspot-location";

/**
 * Which ecosystem the phone runs. Decided at runtime, so ONE Android build
 * serves Google Play and Huawei AppGallery.
 *
 *  - "ios"     iPhone
 *  - "gms"     Android with Google Play services
 *  - "microg"  microG (open-source stand-in, same package name) — e.g. installed on a Huawei
 *  - "hms"     Huawei without Google Play services (HMS Core present)
 *  - "aosp"    Android with neither (some de-Googled / Chinese-market phones)
 */
export type Ecosystem = "ios" | "gms" | "microg" | "hms" | "aosp";

let cached: Ecosystem | null = null;

export function getEcosystem(): Ecosystem {
  if (cached) return cached;
  if (Platform.OS === "ios") return (cached = "ios");
  const info = EasySpotLocation?.getServicesInfo();
  // Module missing (old dev build): assume GMS, the 1.x behaviour.
  if (!info) return (cached = "gms");
  // microG is not Google: on a Huawei with microG the phone's own location is used, so show "Huawei".
  const microg = /microg/i.test(info.gmsLabel ?? "");
  cached = info.gms && !microg ? "gms" : info.hms ? "hms" : microg ? "microg" : "aosp";
  return cached;
}

export const hasGoogleServices = () => getEcosystem() === "gms";
