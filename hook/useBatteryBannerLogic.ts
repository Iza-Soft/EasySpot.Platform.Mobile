// hooks/useBatteryBannerLogic.ts
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkBatteryOptimizations } from "../utils/deviceUtils"; // 👈 не забравяйте да импортирате

export const useBatteryBannerLogic = () => {
  const [shouldShowBanner, setShouldShowBanner] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkBannerVisibility();
  }, []);

  const checkBannerVisibility = async () => {
    try {
      // Get device info
      const info = await checkBatteryOptimizations();
      setDeviceInfo(info);

      if (!info || !info.needsOptimization) {
        setShouldShowBanner(false);
        return;
      }

      // Check for dismissed
      const dismissed = await AsyncStorage.getItem("@battery_banner_dismissed");
      const dismissCount = await AsyncStorage.getItem("@battery_dismiss_count");
      const dismisses = dismissCount ? parseInt(dismissCount, 10) : 0;

      // Check for instruction openings
      const instructionsOpened = await AsyncStorage.getItem(
        "@instructions_opened_count",
      );
      const openedCount = instructionsOpened
        ? parseInt(instructionsOpened, 10)
        : 0;

      // Check how long the user have been using the app
      const firstLaunch = await AsyncStorage.getItem("@first_launch_date");
      let firstLaunchDate = firstLaunch
        ? parseInt(firstLaunch, 10)
        : Date.now();

      // If there is no entry, then it is a first run
      if (!firstLaunch) {
        await AsyncStorage.setItem("@first_launch_date", Date.now().toString());
      }

      const daysSinceFirstLaunch = Math.floor(
        (Date.now() - firstLaunchDate) / (24 * 60 * 60 * 1000),
      );

      // Solution: we consider that user has made the settings if:
      const hasMadeSettings =
        openedCount >= 2 || dismisses >= 3 || daysSinceFirstLaunch > 14;

      // Check for dismissed (if dismissed < 3 days ago)
      if (dismissed && !hasMadeSettings) {
        const dismissedTime = parseInt(dismissed, 10);
        const now = Date.now();
        if (now - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
          setIsDismissed(true);
        } else {
          setIsDismissed(false);
        }
      }

      setShouldShowBanner(!hasMadeSettings && !isDismissed);
    } catch (error) {
      console.error("Error checking banner visibility:", error);
      setShouldShowBanner(false);
      setDeviceInfo(null);
    }
  };

  const handleDismiss = async () => {
    try {
      // We increase the dismissal counter
      const currentCount = await AsyncStorage.getItem("@battery_dismiss_count");
      const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
      await AsyncStorage.setItem("@battery_dismiss_count", newCount.toString());

      await AsyncStorage.setItem(
        "@battery_banner_dismissed",
        Date.now().toString(),
      );
      setIsDismissed(true);
      setShouldShowBanner(false);
    } catch (error) {
      console.error("Error dismissing banner:", error);
    }
  };

  const handleInstructionsOpened = async () => {
    try {
      // We increase the counter of opening instructions
      const currentCount = await AsyncStorage.getItem(
        "@instructions_opened_count",
      );
      const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
      await AsyncStorage.setItem(
        "@instructions_opened_count",
        newCount.toString(),
      );
    } catch (error) {
      console.error("Error counting instructions opens:", error);
    }
  };

  return {
    shouldShowBanner,
    deviceInfo,
    handleDismiss,
    handleInstructionsOpened,
  };
};
