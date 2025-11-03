// import * as Notifications from "expo-notifications";
// import { Platform } from "react-native";

// // ✅ Configure Android channel and request permissions
// export async function setupNotifications() {
//   // ✅ Set how notifications behave when received
//   Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//       shouldShowAlert: true,
//       shouldPlaySound: true,
//       shouldSetBadge: false,
//       shouldShowBanner: true,
//       shouldShowList: true,
//     }),
//   });

//   if (Platform.OS === "android") {
//     await Notifications.setNotificationChannelAsync("default", {
//       name: "Default",
//       importance: Notifications.AndroidImportance.MAX,
//       sound: "default",
//       vibrationPattern: [250, 250, 500, 250],
//     });
//   }

//   const { status } = await Notifications.getPermissionsAsync();

//   if (status !== "granted") {
//     const { status: newStatus } = await Notifications.requestPermissionsAsync();
//     if (newStatus !== "granted") {
//       console.warn("🚫 Notification permissions not granted");
//     }
//   }
// }
