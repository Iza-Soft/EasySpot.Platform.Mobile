/**
 * Navigation apps — 2.0: Settings lists ONLY the apps installed on this phone
 * (+ OpenStreetMap in the browser as the always-working fallback).
 *
 *  Android — the phone itself tells us every app that can show a geo: point
 *            (Kotlin listMapApps), with its real name and icon. Any map app
 *            works, even one not listed below.
 *  iPhone  — Apple only lets us check apps we list in advance
 *            (LSApplicationQueriesSchemes in app.config.ts), so the known
 *            apps below are checked; Apple Maps is always there.
 *
 * The saved choice is a string: a known id (Maps enum — old saves keep working)
 * or "app:<android package>" for an app we don't know by name.
 */
export enum Maps {
  google = "Google",
  waze = "Waze",
  petal = "Petal",
  apple = "Apple",
  /** Kept only so an old saved choice still reads; no longer offered. */
  bing = "Bing",
  here = "Here",
  osm = "OpenStreetMap",
  sygic = "Sygic",
  tomtom = "TomTom",
  magicEarth = "MagicEarth",
  organic = "OrganicMaps",
  osmand = "OsmAnd",
  yandex = "Yandex",
}

/** Maps enum value or "app:<android package>". */
export type MapChoice = string;

export interface MapProvider {
  id: Maps;
  label: string;
  brandColor: string;
  initial: string;
  /** Android package — to recognise it in the system list and open it directly. */
  androidPackage?: string;
  /** iOS scheme used to check it is installed (must be in LSApplicationQueriesSchemes). */
  iosScheme?: string;
  /** iOS: link that opens this app on a point. */
  iosUrl?: (lat: number, lng: number) => string;
  platforms: ("android" | "ios")[];
  /** Opens in the browser (no app). */
  webOnly?: boolean;
}

const enc = encodeURIComponent;

/** Known apps, in the order they are listed (most used first). */
export const MAP_PROVIDERS: MapProvider[] = [
  { id: Maps.google, label: "Google Maps", brandColor: "#4285F4", initial: "G", androidPackage: "com.google.android.apps.maps", iosScheme: "comgooglemaps://", iosUrl: (a, o) => `comgooglemaps://?q=${a},${o}`, platforms: ["android", "ios"] },
  { id: Maps.petal, label: "Petal Maps", brandColor: "#CF0A2C", initial: "P", androidPackage: "com.huawei.maps.app", platforms: ["android"] },
  { id: Maps.apple, label: "Apple Maps", brandColor: "#1C1C1E", initial: "A", iosUrl: (a, o) => `maps://?q=${a},${o}`, platforms: ["ios"] },
  { id: Maps.waze, label: "Waze", brandColor: "#33CCFF", initial: "W", androidPackage: "com.waze", iosScheme: "waze://", iosUrl: (a, o) => `waze://?ll=${a},${o}&navigate=yes`, platforms: ["android", "ios"] },
  { id: Maps.here, label: "HERE WeGo", brandColor: "#00AFAA", initial: "H", androidPackage: "com.here.app.maps", iosScheme: "here-location://", iosUrl: (a, o) => `here-location://${a},${o}`, platforms: ["android", "ios"] },
  { id: Maps.sygic, label: "Sygic", brandColor: "#E2231A", initial: "S", androidPackage: "com.sygic.aura", iosScheme: "com.sygic.aura://", iosUrl: (a, o) => `com.sygic.aura://coordinate|${o}|${a}|show`, platforms: ["android", "ios"] },
  { id: Maps.tomtom, label: "TomTom GO", brandColor: "#DF1B12", initial: "T", androidPackage: "com.tomtom.gplay.navapp", iosScheme: "tomtomgo://", iosUrl: (a, o) => `tomtomgo://x-callback-url/navigate?destination=${a},${o}`, platforms: ["android", "ios"] },
  { id: Maps.magicEarth, label: "Magic Earth", brandColor: "#1F6FD1", initial: "M", androidPackage: "com.generalmagic.magicearth", iosScheme: "magicearth://", iosUrl: (a, o) => `magicearth://?show_on_map&lat=${a}&lon=${o}&name=EasySpot`, platforms: ["android", "ios"] },
  { id: Maps.organic, label: "Organic Maps", brandColor: "#2E7D32", initial: "OM", androidPackage: "app.organicmaps", iosScheme: "om://", iosUrl: (a, o) => `om://map?ll=${a},${o}&n=EasySpot`, platforms: ["android", "ios"] },
  { id: Maps.osmand, label: "OsmAnd", brandColor: "#F28C00", initial: "O", androidPackage: "net.osmand", iosScheme: "osmandmaps://", iosUrl: (a, o) => `osmandmaps://?lat=${a}&lon=${o}&z=16&title=${enc("EasySpot")}`, platforms: ["android", "ios"] },
  { id: Maps.yandex, label: "Yandex Maps", brandColor: "#FC3F1D", initial: "Я", androidPackage: "ru.yandex.yandexmaps", iosScheme: "yandexmaps://", iosUrl: (a, o) => `yandexmaps://maps.yandex.ru/?pt=${o},${a}&z=16`, platforms: ["android", "ios"] },
  { id: Maps.osm, label: "OpenStreetMap", brandColor: "#7EBC6F", initial: "OSM", platforms: ["android", "ios"], webOnly: true },
];

/** Android packages we know by name (the free Sygic / OsmAnd builds have other ids). */
const PACKAGE_ALIASES: Record<string, Maps> = {
  "net.osmand.plus": Maps.osmand,
  "com.mapswithme.maps.pro": Maps.organic,
  "ru.yandex.yandexnavi": Maps.yandex,
};

export function providerById(id: MapChoice | null | undefined): MapProvider | undefined {
  return MAP_PROVIDERS.find((p) => p.id === id);
}

export function providerByPackage(pkg: string): MapProvider | undefined {
  const alias = PACKAGE_ALIASES[pkg];
  return alias ? providerById(alias) : MAP_PROVIDERS.find((p) => p.androidPackage === pkg);
}

/** One row in Settings. */
export interface MapApp {
  id: MapChoice;
  label: string;
  /** Android: the real icon from the phone. */
  icon?: string | null;
  brandColor: string;
  initial: string;
  /** Android package to open with a geo: point. */
  androidPackage?: string;
  webOnly?: boolean;
}

const OSM_APP = (): MapApp => {
  const p = providerById(Maps.osm)!;
  return { id: p.id, label: p.label, brandColor: p.brandColor, initial: p.initial, webOnly: true };
};

/** Android: turns the system list (Kotlin listMapApps) into Settings rows — known apps first, then A–Z, OpenStreetMap last. */
export function androidMapApps(found: { packageName: string; label: string; icon?: string | null }[]): MapApp[] {
  const rank = (a: MapApp) => {
    const i = MAP_PROVIDERS.findIndex((p) => p.id === a.id);
    return i < 0 ? MAP_PROVIDERS.length : i;
  };
  const seen = new Set<string>();
  const apps: MapApp[] = [];
  for (const f of found) {
    const known = providerByPackage(f.packageName);
    const id = known ? known.id : `app:${f.packageName}`;
    if (seen.has(id)) continue; // e.g. OsmAnd and OsmAnd+ both installed
    seen.add(id);
    apps.push({
      id,
      label: known?.label ?? f.label,
      icon: f.icon ?? null,
      brandColor: known?.brandColor ?? "#5A606C",
      initial: known?.initial ?? (f.label.trim()[0] ?? "?").toUpperCase(),
      androidPackage: f.packageName,
    });
  }
  apps.sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label));
  return [...apps, OSM_APP()];
}

/** iPhone: Apple Maps + the known apps that are installed + OpenStreetMap. */
export function iosMapApps(installed: (id: Maps) => boolean): MapApp[] {
  const apps = MAP_PROVIDERS.filter((p) => p.platforms.includes("ios") && !p.webOnly && (p.id === Maps.apple || installed(p.id))).map(
    (p): MapApp => ({ id: p.id, label: p.label, brandColor: p.brandColor, initial: p.initial }),
  );
  return [...apps, OSM_APP()];
}

/**
 * The phone's main map when nothing (valid) is chosen, or the chosen app was removed:
 * Petal Maps on Huawei, else Google Maps, else Apple Maps, else the first app, else OpenStreetMap.
 */
export function defaultMap(apps: MapApp[], isHuawei: boolean): MapChoice {
  const has = (id: Maps) => apps.some((a) => a.id === id);
  if (isHuawei && has(Maps.petal)) return Maps.petal;
  if (has(Maps.google)) return Maps.google;
  if (has(Maps.apple)) return Maps.apple;
  if (has(Maps.petal)) return Maps.petal;
  return apps.find((a) => !a.webOnly)?.id ?? Maps.osm;
}

/** The saved choice if that app is still on the phone; otherwise the phone's main map. */
export function resolveMap(saved: MapChoice | null | undefined, apps: MapApp[], isHuawei: boolean): MapChoice {
  if (saved && saved !== Maps.bing && apps.some((a) => a.id === saved)) return saved;
  return defaultMap(apps, isHuawei);
}

/** Android package for a saved choice (known id or "app:<pkg>"). */
export function packageForChoice(choice: MapChoice): string | undefined {
  if (choice.startsWith("app:")) return choice.slice(4);
  return providerById(choice)?.androidPackage;
}
