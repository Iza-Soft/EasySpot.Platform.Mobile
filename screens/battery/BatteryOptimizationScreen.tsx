import React, { useEffect, useState } from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import { checkBatteryOptimizations } from "../../utils/deviceUtils";
import { colors } from "../../themes/main";
import { useTranslation } from "react-i18next";
import { typography } from "../../themes/typography";

const BatteryOptimizationScreenComponent = () => {
  const { t: localize } = useTranslation();
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const info = await checkBatteryOptimizations();
      setDeviceInfo(info);
    } catch (error) {
      console.error("Error checking device:", error);
    }
  };

  if (!deviceInfo) {
    return null;
  }

  const getBatteryInstructions = () => {
    const manufacturerLower = deviceInfo.manufacturer.toLowerCase();

    if (manufacturerLower.includes("huawei")) {
      return (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
            {localize("battery_screen.manufacturers.huawei.title")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.huawei.steps.1")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.huawei.steps.2")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.huawei.steps.3")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.huawei.steps.4")}
          </Text>
          <Text style={styles.subListItem}>
            {localize("battery_screen.manufacturers.huawei.steps.4a")}
          </Text>
          <Text style={styles.subListItem}>
            {localize("battery_screen.manufacturers.huawei.steps.4b")}
          </Text>
          <Text style={styles.subListItem}>
            {localize("battery_screen.manufacturers.huawei.steps.4c")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.huawei.steps.5")}
          </Text>
        </>
      );
    }

    if (manufacturerLower.includes("xiaomi")) {
      return (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
            {localize("battery_screen.manufacturers.xiaomi.title")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.xiaomi.steps.1")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.xiaomi.steps.2")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.xiaomi.steps.3")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.xiaomi.steps.4")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.xiaomi.steps.5")}
          </Text>
          <Text style={styles.subListItem}>
            {localize("battery_screen.manufacturers.xiaomi.steps.5a")}
          </Text>
          <Text style={styles.subListItem}>
            {localize("battery_screen.manufacturers.xiaomi.steps.5b")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.xiaomi.steps.6")}
          </Text>
        </>
      );
    }

    if (manufacturerLower.includes("oneplus")) {
      return (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
            {localize("battery_screen.manufacturers.oneplus.title")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.oneplus.steps.1")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.oneplus.steps.2")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.oneplus.steps.3")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.oneplus.steps.4")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.oneplus.steps.5")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.oneplus.steps.6")}
          </Text>
        </>
      );
    }

    if (manufacturerLower.includes("samsung")) {
      return (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
            {localize("battery_screen.manufacturers.samsung.title")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.samsung.steps.1")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.samsung.steps.2")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.samsung.steps.3")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.samsung.steps.4")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.samsung.steps.5")}
          </Text>
          <Text style={styles.listItem}>
            {localize("battery_screen.manufacturers.samsung.steps.6")}
          </Text>
        </>
      );
    }

    return (
      <>
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
          {localize("battery_screen.manufacturers.default.title")}
        </Text>
        <Text style={styles.listItem}>
          {localize("battery_screen.manufacturers.default.steps.1")}
        </Text>
        <Text style={styles.listItem}>
          {localize("battery_screen.manufacturers.default.steps.2")}
        </Text>
        <Text style={styles.listItem}>
          {localize("battery_screen.manufacturers.default.steps.3")}
        </Text>
        <Text style={styles.listItem}>
          {localize("battery_screen.manufacturers.default.steps.4")}
        </Text>
        <Text style={styles.listItem}>
          {localize("battery_screen.manufacturers.default.steps.5")}
        </Text>
      </>
    );
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{localize("battery_screen.title")}</Text>

        <Text style={styles.deviceInfo}>
          {localize("battery_screen.your_device", {
            manufacturer: deviceInfo.manufacturer,
            model: deviceInfo.model,
          })}
        </Text>

        <Text style={styles.paragraph}>
          {localize("battery_screen.description", {
            manufacturer: deviceInfo.manufacturer,
          })}
        </Text>

        <Text style={styles.sectionTitle}>
          {localize("battery_screen.how_to_setup")}
        </Text>
        <Text style={styles.paragraph}>
          {localize("battery_screen.follow_steps")}
        </Text>

        <Text style={styles.listItem}>
          {localize("battery_screen.steps.1")}
        </Text>
        <Text style={styles.listItem}>
          {localize("battery_screen.steps.2")}
        </Text>
        <Text style={styles.listItem}>
          {localize("battery_screen.steps.3")}
        </Text>
        <Text style={styles.listItem}>
          {localize("battery_screen.steps.4")}
        </Text>
        <Text style={styles.subListItem}>
          {localize("battery_screen.steps.4a")}
        </Text>
        <Text style={styles.subListItem}>
          {localize("battery_screen.steps.4b")}
        </Text>
        <Text style={styles.subListItem}>
          {localize("battery_screen.steps.4c")}
        </Text>
        <Text style={styles.listItem}>
          {localize("battery_screen.steps.5")}
        </Text>

        {getBatteryInstructions()}

        <Text style={styles.footer}>
          {localize("battery_screen.footer_warning")}
        </Text>
        <Text style={styles.footerDetail}>
          {localize("battery_screen.footer_without")}
        </Text>
        <Text style={styles.footerDetail}>
          {localize("battery_screen.footer_with")}
        </Text>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: typography.headerLarge,
  deviceInfo: {
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 20,
  },
  sectionTitle: typography.sectionTitle,
  paragraph: typography.body,
  listItem: { ...typography.body, marginLeft: 10 },
  subListItem: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginLeft: 30,
    marginBottom: 2,
  },
  buttonContainer: {
    marginBottom: 8,
    gap: 10,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  doneButton: {
    backgroundColor: colors.tab,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.card,
  },
  footer: { ...typography.footer, marginTop: 20, marginBottom: 8 },
  footerDetail: {
    fontSize: 12,
    color: colors.muted,
    marginLeft: 25,
    marginBottom: 4,
  },
});

export default BatteryOptimizationScreenComponent;
