import { Linking, Share, Platform } from "react-native";
import { NavigationProps } from "../types/props";
import { Maps, packageForChoice, providerById } from "../constants/maps";
import { EasySpotLocation } from "../modules/easyspot-location";
import { getCurrentFix } from "../platform/location";
import i18n from "../i18n";
import { getPreferredMap } from "./map-preference-service";

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

export async function ShareLocationAsync(coordinates?: {
  latitude: number | undefined;
  longitude: number | undefined;
}) {
  let latitude: number;
  let longitude: number;

  if (coordinates?.latitude != null && coordinates?.longitude != null) {
    latitude = coordinates.latitude;
    longitude = coordinates.longitude;
  } else {
    // v2: Huawei-safe position (platform/location.ts)
    ({ latitude, longitude } = await getCurrentFix());
  }

  const preferredMap = await getPreferredMap();

  //Sharing should always be over the internet - the receiver may not have the same app
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

  const message = i18n.t("navigation.share_message", { url });

  await Share.share({
    message,
    url,
    title: i18n.t("navigation.share_title"),
  });
}
