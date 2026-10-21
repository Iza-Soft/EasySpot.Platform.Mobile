import { Linking, Share, Platform } from "react-native";
import { NavigationProps } from "../types/props";
import { Maps, packageForChoice, providerById } from "../constants/maps";
import { EasySpotLocation } from "../modules/easyspot-location";
import { getCurrentFix } from "../platform/location";
import i18n from "../i18n";
import { getPreferredMap } from "./map-preference-service";
import { displayLevel } from "../domain/level";
import { ShareSubject, shareText } from "../domain/share";
import { getPrefs } from "../state/prefs";
import { reverseGeocode, streetLine } from "./geocoding";
import { isActiveParking, Spot, spotAddress } from "./spots-service";

export async function openMapsAsync(navigation: NavigationProps) {
  const { latitude, longitude } = navigation;
  // The chosen app if still installed, else the phone's main map (map-preference-service).
  const preferredMap = await getPreferredMap();
  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;

  try {
    if (preferredMap !== Maps.osm) {
      if (Platform.OS === "android") {
        // Open exactly the chosen app with a geo: point (Kotlin) — works for any map app.
        const pkg = packageForChoice(preferredMap);
        if (pkg && EasySpotLocation?.openGeoInApp?.(pkg, latitude, longitude, "EasySpot")) return;
        // Any app that can show a geo: point.
        const geo = `geo:${latitude},${longitude}?q=${latitude},${longitude}(EasySpot)`;
        if (await Linking.canOpenURL(geo)) {
          await Linking.openURL(geo);
          return;
        }
      } else {
        const url = providerById(preferredMap)?.iosUrl?.(latitude, longitude);
        if (url && (await Linking.canOpenURL(url).catch(() => false))) {
          await Linking.openURL(url);
          return;
        }
        await Linking.openURL(`maps://?q=${latitude},${longitude}`);
        return;
      }
    }
    // OpenStreetMap — and the fallback when no app can open the point.
    await Linking.openURL(osmUrl);
  } catch (err) {
    console.error("❌ Failed to open maps:", err);
  }
}

/** Map link for sharing — always a web link: the receiver may not have the same app. */
export async function shareUrlAsync(latitude: number, longitude: number): Promise<string> {
  const preferredMap = await getPreferredMap();

  let url: string;
  switch (preferredMap) {
    case Maps.google:
      url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      break;
    case Maps.waze:
      url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
      break;
    case Maps.apple:
      url = `https://maps.apple.com/?q=${latitude},${longitude}`;
      break;
    case Maps.bing:
      url = `https://www.bing.com/maps?q=${latitude},${longitude}`;
      break;
    case Maps.here:
      url = `https://share.here.com/l/${latitude},${longitude}`;
      break;
    case Maps.osm:
      url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;
      break;
    default:
      url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  return url;
}

async function shareAsync(subject: ShareSubject) {
  const url = await shareUrlAsync(subject.latitude, subject.longitude);
  const { message, title } = shareText(subject, url, (k) => i18n.t(k));
  // Android: message + title (the share sheet's heading); iOS: the message only (no url: it would be sent twice).
  await Share.share({ message, title }, { dialogTitle: title, subject: title });
}

/** Home → "Share where I am": a fresh fix and its address (when the phone's geocoder answers within 2.5 s). */
export async function shareHereAsync() {
  // v2: Huawei-safe position (platform/location.ts)
  const { latitude, longitude } = await getCurrentFix();
  const a = await Promise.race([
    reverseGeocode(latitude, longitude),
    new Promise<null>((r) => setTimeout(() => r(null), 2500)),
  ]).catch(() => null);
  const address = a ? [streetLine(a) ?? a.estate ?? null, a.city].filter(Boolean).join(", ") || null : null;
  await shareAsync({ kind: "here", latitude, longitude, address });
}

/** A saved spot: an active parking ("My car is parked here"), a past one, or a favorite place. */
export async function shareSpotAsync(spot: Spot) {
  const kind = spot.type === "favorites" ? "place" : isActiveParking(spot) ? "car" : "pastParking";
  await shareAsync({
    kind,
    latitude: spot.latitude,
    longitude: spot.longitude,
    name: spot.title,
    address: spotAddress(spot),
    level: spot.level ? displayLevel(spot.level, getPrefs().levelLabels) : null,
    zone: spot.section,
    spot: spot.spot,
  });
}
