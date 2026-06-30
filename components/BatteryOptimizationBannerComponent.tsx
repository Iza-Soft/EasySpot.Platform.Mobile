// components/BatteryOptimizationBanner.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../themes/main";
import { useTranslation } from "react-i18next";

const BatteryOptimizationBannerComponent = ({
  deviceInfo,
  onInstructionsPress,
  onDismiss,
}: {
  deviceInfo: any;
  onInstructionsPress: () => void;
  onDismiss: () => void;
}) => {
  const { t: localize } = useTranslation();
  if (!deviceInfo) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerHeader}>
            <Text style={styles.bannerIcon}>⚙️</Text>
            <Text style={styles.bannerTitle}>
              {localize("battery_banner.title")}
            </Text>
          </View>

          <View style={styles.bannerMainContent}>
            <Text style={styles.bannerSubtitle}>
              {localize("battery_banner.subtitle", {
                manufacturer: deviceInfo.manufacturer,
              })}
            </Text>

            <View style={styles.bannerButtons}>
              <TouchableOpacity
                style={styles.instructionsButton}
                onPress={onInstructionsPress}
              >
                <Text style={styles.instructionsButtonText}>
                  {localize("battery_banner.instructions")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismiss}
              >
                <Text style={styles.dismissButtonText}>
                  {localize("battery_banner.dismiss")}
                </Text>
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

export default BatteryOptimizationBannerComponent;
