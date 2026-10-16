import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

export interface ServicesInfo {
  gms: boolean;
  /** "Google Play services" or "microG Services" — same package name. */
  gmsLabel: string | null;
  /** Google Play services actually work (GoogleApiAvailability SUCCESS). */
  gmsUsable: boolean;
  hms: boolean;
  hasBarometer: boolean;
  manufacturer: string;
  sdkInt: number;
}

export interface NativeFix {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;
  provider: string | null;
}

/** An installed app that can show a geo: point (Android, from the system). */
export interface NativeMapApp {
  packageName: string;
  label: string;
  /** data:image/png;base64,… — null if the icon could not be drawn. */
  icon: string | null;
}

export interface ReminderStatus {
  notifications: boolean;
  exactAlarms: boolean;
  battery: boolean;
  oem: "huawei" | "xiaomi" | null;
  batteryPage: "appInfo" | "list";
  sdkInt: number;
}

export type ReminderSetting = "notifications" | "exactAlarms" | "battery" | "launch";

/** The phone's geocoder result — same fields as expo-location's LocationGeocodedAddress. */
export interface NativeAddress {
  city: string | null;
  district: string | null;
  streetNumber: string | null;
  street: string | null;
  region: string | null;
  subregion: string | null;
  country: string | null;
  postalCode: string | null;
  name: string | null;
  isoCountryCode: string | null;
  formattedAddress: string | null;
}

interface EasySpotLocationNative {
  reverseGeocodeAsync(lat: number, lng: number): Promise<NativeAddress[]>;
  /** hPa (median over sampleMs), null without a barometer. */
  getPressureAsync(sampleMs: number): Promise<number | null>;
  getReminderStatus(): ReminderStatus;
  /** Which page opened: "exact" (that step's page), "battery", "appInfo"; null = none. */
  openReminderSetting(kind: ReminderSetting): "exact" | "battery" | "appInfo" | null;
  listMapApps(): NativeMapApp[];
  getServicesInfo(): ServicesInfo;
  installedPackages(packages: string[]): string[];
  openGeoInApp(pkg: string, lat: number, lng: number, label: string | null): boolean;
  isIgnoringBatteryOptimizations(): boolean;
  openAppLanguageSettings(): boolean;
  /** fresh = measure now unless a remembered fix is ≤ 15 m (use when the fix is saved). */
  getCurrentPositionAsync(timeoutMs: number, fresh: boolean): Promise<NativeFix>;
}

/** null on iOS, on web, and in an old dev build that does not include the module yet. */
export const EasySpotLocation: EasySpotLocationNative | null =
  Platform.OS === "android" ? requireOptionalNativeModule<EasySpotLocationNative>("EasySpotLocation") : null;
