// components/BatteryOptimizationBanner.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkBatteryOptimizations } from "../utils/deviceUtils";
import { colors } from "../themes/main";

const BatteryOptimizationBanner = () => {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasMadeSettings, setHasMadeSettings] = useState(false);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const info = await checkBatteryOptimizations();
      setDeviceInfo(info);

      // // 2. Проверка колко пъти е отварял инструкциите
      // const instructionsOpened = await AsyncStorage.getItem(
      //   "@instructions_opened_count",
      // );
      // const openedCount = instructionsOpened
      //   ? parseInt(instructionsOpened, 10)
      //   : 0;

      // // 3. Проверка дали е отлагал много пъти
      // const dismissCount = await AsyncStorage.getItem("@battery_dismiss_count");
      // const dismisses = dismissCount ? parseInt(dismissCount, 10) : 0;

      // // 4. Проверка от колко време ползва приложението
      // const firstLaunch = await AsyncStorage.getItem("@first_launch_date");
      // const daysSinceFirstLaunch = firstLaunch
      //   ? Math.floor(
      //       (Date.now() - parseInt(firstLaunch, 10)) / (24 * 60 * 60 * 1000),
      //     )
      //   : 0;

      // // Решение: Считаме, че е направил настройките, ако:
      // // - Отварял е инструкциите >= 2 пъти, ИЛИ
      // // - Отлагал е >= 3 пъти, ИЛИ
      // // - Ползва приложението от > 2 седмици
      // const shouldConsiderDone =
      //   openedCount >= 2 || dismisses >= 3 || daysSinceFirstLaunch > 14;

      // setHasMadeSettings(shouldConsiderDone);

      // // Лог за дебъгване
      // console.log("Banner decision:", {
      //   openedCount,
      //   dismisses,
      //   daysSinceFirstLaunch,
      //   shouldConsiderDone,
      // });

      // // Проверка за dismissed
      // const dismissed = await AsyncStorage.getItem("@battery_banner_dismissed");
      // if (dismissed && !shouldConsiderDone) {
      //   const dismissedTime = parseInt(dismissed, 10);
      //   const now = Date.now();
      //   if (now - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
      //     setIsDismissed(true);
      //   }
      // }
    } catch (error) {
      console.error("Error checking device:", error);
    }
  };

  const handleDismiss = async () => {
    // Увеличаваме брояча на dismiss-ванията
    // const currentCount = await AsyncStorage.getItem("@battery_dismiss_count");
    // const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
    // await AsyncStorage.setItem("@battery_dismiss_count", newCount.toString());

    // await AsyncStorage.setItem(
    //   "@battery_banner_dismissed",
    //   Date.now().toString(),
    // );
    setIsDismissed(true);
  };

  const handleInstructionsOpened = async () => {
    // Увеличаваме брояча на отваряния на инструкции
    // const currentCount = await AsyncStorage.getItem(
    //   "@instructions_opened_count",
    // );
    // const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
    // await AsyncStorage.setItem(
    //   "@instructions_opened_count",
    //   newCount.toString(),
    // );
  };

  if (
    !deviceInfo ||
    !deviceInfo.needsOptimization //||
    // hasMadeSettings ||
    // isDismissed
  ) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerHeader}>
            <Text style={styles.bannerIcon}>⚙️</Text>
            <Text style={styles.bannerTitle}>Battery Optimization Needed</Text>
          </View>

          <View style={styles.bannerMainContent}>
            <Text style={styles.bannerSubtitle}>
              Your {deviceInfo.manufacturer} device needs special battery
              settings for reliable parking reminders.
            </Text>

            <View style={styles.bannerButtons}>
              <TouchableOpacity
                style={styles.instructionsButton}
                onPress={handleInstructionsOpened}
              >
                <Text style={styles.instructionsButtonText}>Instructions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismiss}
              >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.bg,
  },
  banner: {
    backgroundColor: colors.warning + "15",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.warning + "30",
  },
  bannerContent: {
    gap: 8,
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerIcon: {
    fontSize: 20,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.warning,
    flex: 1,
  },
  bannerMainContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginLeft: 28, // Отстъп за да се подравни с текста под иконата (20px икона + 8px gap)
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.muted,
    flex: 2,
    minWidth: 200,
  },
  bannerButtons: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
    minWidth: 180,
  },
  instructionsButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  instructionsButtonText: {
    color: colors.card,
    fontWeight: "600",
    fontSize: 13,
  },
  dismissButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  dismissButtonText: {
    color: colors.muted,
    fontWeight: "500",
    fontSize: 13,
  },
});

export default BatteryOptimizationBanner;
