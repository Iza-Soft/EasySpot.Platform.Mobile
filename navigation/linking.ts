import { LinkingOptions } from "@react-navigation/native";
import { IosNotifications, NotificationsT } from "../platform/ios-only";
import { Linking } from "react-native";
import { RootStackParamList } from "./types";

/**
 * Opening EasySpot from a reminder goes to THAT parking, not Home:
 *  Android — the notification tap and the phone's "next alarm" tap open
 *            MainActivity with easyspot://spot/<id> (ParkingReceiver / ParkingModule.kt);
 *  iPhone  — the local notification carries the same URL in its data.
 * The test reminder opens easyspot://reminders. Back always leads to Home.
 */
export const spotUrl = (id: number) => `easyspot://spot/${id}`;
export const REMINDERS_URL = "easyspot://reminders";

const urlFromResponse = (r: NotificationsT.NotificationResponse | null | undefined) => {
  const url = r?.notification.request.content.data?.url;
  return typeof url === "string" ? url : null;
};

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["easyspot://"],
  config: {
    initialRouteName: "Tabs",
    screens: {
      Tabs: { screens: { Park: "home", Spots: "spots", Settings: "settings" } },
      // Parked switches itself to SpotDetails if that parking has already ended.
      Parked: { path: "spot/:id", parse: { id: Number } },
      Reminders: "reminders",
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) return url;
    // iPhone only — Android reminders open the app with the URL itself (ParkingReceiver.kt).
    return urlFromResponse(await IosNotifications?.getLastNotificationResponseAsync().catch(() => null));
  },
  subscribe(listener) {
    const link = Linking.addEventListener("url", ({ url }) => listener(url));
    const tap = IosNotifications?.addNotificationResponseReceivedListener((r) => {
      const url = urlFromResponse(r);
      if (url) listener(url);
    });
    return () => {
      link.remove();
      tap?.remove();
    };
  },
};
