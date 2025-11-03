// import * as Notifications from "expo-notifications";
// // import AsyncStorage from "@react-native-async-storage/async-storage";

// const PARK_DURATION = 60 * 60; // 1 hour in seconds

// export async function scheduleNotificationAsync() {
//   const startTime = Date.now();
//   // await AsyncStorage.setItem("parkingStart", startTime.toString());

//   // Cancel any old notifications first
//   await Notifications.cancelAllScheduledNotificationsAsync();

//   // Notification 10 minutes before expiration (after 50 mins)
//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title: "Parking Alert 🚘",
//       body: "Parking time expires in 10 minutes ⏰",
//       sound: true,
//     },
//     trigger: {
//       type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
//       seconds: 1 * 60,
//       repeats: false,
//     },
//   });

//   // Notification at expiration (after 60 mins)
//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title: "Parking Time Expired 🚗💨",
//       body: "Your parking session has ended.",
//       sound: true,
//     },
//     trigger: {
//       type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
//       seconds: 2 * 60,
//       repeats: false,
//     },
//   });
// }
