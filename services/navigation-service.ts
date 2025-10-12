import { Linking, Share } from "react-native";
import { NavigationProps } from "../types/props";
import { Maps, MapUrl } from "../constants/maps";
import * as Location from "expo-location";

export async function openMapsAsync(navigation: NavigationProps) {
  const { latitude, longitude, map } = navigation;
  let url: string;
  switch (map) {
    case Maps.google:
      url = `${MapUrl.Google}${latitude},${longitude}`;
      break;
    case Maps.waze:
      url = `${MapUrl.Waze}${latitude},${longitude}&navigate=yes`;
      break;
    default:
      throw new Error(`Unsupported map provider: ${map}`);
  }
  await Linking.openURL(url).catch((err) =>
    console.error("❌ Failed to open Google Maps:", err)
  );
}

export async function ShareLocationAsync(map: Maps) {
  const loc = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = loc.coords;
  let url: string;
  switch (map) {
    case Maps.google:
      url = `${MapUrl.Google}${latitude},${longitude}`;
      break;
    case Maps.waze:
      url = `${MapUrl.Waze}${latitude},${longitude}&navigate=yes`;
      break;
    default:
      throw new Error(`Unsupported map provider: ${map}`);
  }

  const message = `📍 Here's my current location: ${url}`;

  await Share.share({
    message,
    url,
    title: "My Current Location",
  });
}
