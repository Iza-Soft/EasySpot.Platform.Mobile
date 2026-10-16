import { Linking, Platform } from "react-native";
import { androidMapApps, iosMapApps, MAP_PROVIDERS, MapApp, Maps } from "../constants/maps";
import { EasySpotLocation } from "../modules/easyspot-location";

export interface PhoneMaps {
  apps: MapApp[];
  isHuawei: boolean;
}

/** The map apps installed on this phone right now (+ OpenStreetMap). */
export async function getPhoneMapsAsync(): Promise<PhoneMaps> {
  if (Platform.OS === "ios") {
    const found = await Promise.all(
      MAP_PROVIDERS.filter((p) => p.iosScheme).map(async (p) => ((await Linking.canOpenURL(p.iosScheme!).catch(() => false)) ? p.id : null)),
    );
    const ids = found.filter(Boolean) as Maps[];
    return { apps: iosMapApps((id) => ids.includes(id)), isHuawei: false };
  }
  let isHuawei = false;
  let found: { packageName: string; label: string; icon: string | null }[] = [];
  try {
    isHuawei = /huawei|honor/i.test(EasySpotLocation?.getServicesInfo().manufacturer ?? "");
    if (EasySpotLocation?.listMapApps) {
      found = EasySpotLocation.listMapApps();
    } else if (EasySpotLocation?.installedPackages) {
      // Older native build without listMapApps: check the known packages.
      const pkgs = MAP_PROVIDERS.map((p) => p.androidPackage).filter(Boolean) as string[];
      found = EasySpotLocation.installedPackages(pkgs).map((p) => ({ packageName: p, label: p, icon: null }));
    }
  } catch (e) {
    console.warn("listMapApps failed:", e);
  }
  return { apps: androidMapApps(found), isHuawei };
}
