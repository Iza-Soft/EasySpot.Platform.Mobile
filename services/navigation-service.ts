import { Linking, Share, Platform } from "react-native";
import { NavigationProps } from "../types/props";
import { Maps } from "../constants/maps";
import * as Location from "expo-location";
import i18n from "../i18n";
import { getPreferredMap } from "./map-preference-service";

export async function openMapsAsync(navigation: NavigationProps) {
  const { latitude, longitude } = navigation;
  const preferredMap = await getPreferredMap();

  let nativeUrl: string | null = null;
  let webUrl: string;

  switch (preferredMap) {
    case Maps.google:
      // geo: directly open Andtorid Google Maps
      nativeUrl =
        Platform.OS === "ios"
          ? `comgooglemaps://?q=${latitude},${longitude}`
          : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
      webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      break;

    case Maps.waze:
      // waze:// is the official deep link scheme
      nativeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;
      webUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
      break;

    case Maps.apple:
      // work only for iOS
      nativeUrl = `maps://?q=${latitude},${longitude}`;
      webUrl = `https://maps.apple.com/?q=${latitude},${longitude}`;
      break;

    case Maps.bing:
      // bingmaps: work with Windows, Android/iOS → web
      nativeUrl = `bingmaps:?cp=${latitude}~${longitude}&lvl=16`;
      webUrl = `https://www.bing.com/maps?q=${latitude},${longitude}`;
      break;

    case Maps.here:
      // here-location:// е official HERE WeGo deep link
      nativeUrl = `here-location://${latitude},${longitude}`;
      webUrl = `https://share.here.com/l/${latitude},${longitude}`;
      break;

    case Maps.osm:
      // OpenStreetMap there isn't native app deep link — only web
      nativeUrl = null;
      webUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;
      break;

    default:
      webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  try {
    if (nativeUrl) {
      const canOpen = await Linking.canOpenURL(nativeUrl);
      if (canOpen) {
        await Linking.openURL(nativeUrl); // ← open native app
        return;
      }
    }
    // Fallback → web if the app isn't isntall
    await Linking.openURL(webUrl);
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
    const loc = await Location.getCurrentPositionAsync({});
    latitude = loc.coords.latitude;
    longitude = loc.coords.longitude;
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
