import { Platform, PermissionsAndroid, Linking } from "react-native";
import Toast from "react-native-toast-message";

export const useNotifications = () => {
  const requestNotificationPermission = async (showToastOnDeny = true) => {
    // Само за Android 13 (API 33) и нагоре
    console.log(Platform.OS);
    console.log(Platform.Version);
    if (Platform.OS === "android" && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("✅ Notification permission granted");
          return true;
        } else {
          console.log("❌ Notification permission denied");
          if (showToastOnDeny) {
            Toast.show({
              type: "info",
              text1: "🔔 Notifications disabled",
              text2: "Tap here to open settings and enable notifications.",
              onPress: async () => {
                await Linking.openSettings();
              },
            });
          }
          return false;
        }
      } catch (error) {
        console.error("Failed to request notification permission:", error);
        return false;
      }
    }
    // За iOS или по-стари Android версии - автоматично разрешено
    return true;
  };

  const checkNotificationPermission = async () => {
    // Само за Android 13 (API 33) и нагоре
    console.log(Platform.OS);
    console.log(Platform.Version);
    if (Platform.OS === "android" && Platform.Version >= 33) {
      try {
        return await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      } catch (error) {
        console.error("Failed to check notification permission:", error);
        return false;
      }
    }
    return true;
  };

  return { requestNotificationPermission, checkNotificationPermission };
};
