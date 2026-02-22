import React, { useEffect, useState } from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import { checkBatteryOptimizations } from "../../utils/deviceUtils";
import { colors } from "../../themes/main";

const BatteryOptimizationScreenComponent = () => {
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
            📱 Instructions for Huawei:
          </Text>
          <Text style={styles.listItem}>1. Open Settings</Text>
          <Text style={styles.listItem}>2. Battery → App Launch</Text>
          <Text style={styles.listItem}>3. Find EasySpot</Text>
          <Text style={styles.listItem}>4. Allow:</Text>
          <Text style={styles.subListItem}> • Auto-launch</Text>
          <Text style={styles.subListItem}> • Secondary launch</Text>
          <Text style={styles.subListItem}> • Lock app</Text>
          <Text style={styles.listItem}>5. Then test again</Text>
        </>
      );
    }

    if (manufacturerLower.includes("xiaomi")) {
      return (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
            📱 Instructions for Xiaomi:
          </Text>
          <Text style={styles.listItem}>1. Open Settings</Text>
          <Text style={styles.listItem}>2. Battery & Performance</Text>
          <Text style={styles.listItem}>3. App Battery Management</Text>
          <Text style={styles.listItem}>4. Select EasySpot</Text>
          <Text style={styles.listItem}>5. Choose:</Text>
          <Text style={styles.subListItem}> • No restrictions</Text>
          <Text style={styles.subListItem}> • Allow auto-start</Text>
          <Text style={styles.listItem}>
            6. Also lock the app in Recent apps
          </Text>
        </>
      );
    }

    if (manufacturerLower.includes("oneplus")) {
      return (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
            📱 Instructions for OnePlus:
          </Text>
          <Text style={styles.listItem}>1. Open Settings</Text>
          <Text style={styles.listItem}>2. Battery → Battery Optimization</Text>
          <Text style={styles.listItem}>3. Find EasySpot</Text>
          <Text style={styles.listItem}>4. Select "Don't optimize"</Text>
          <Text style={styles.listItem}>
            5. Also: Settings → Apps → EasySpot
          </Text>
          <Text style={styles.listItem}>6. Allow "Auto-start"</Text>
        </>
      );
    }

    if (manufacturerLower.includes("samsung")) {
      return (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
            📱 Instructions for Samsung:
          </Text>
          <Text style={styles.listItem}>1. Open Settings</Text>
          <Text style={styles.listItem}>2. Device Care → Battery</Text>
          <Text style={styles.listItem}>
            3. App power management → Sleeping apps
          </Text>
          <Text style={styles.listItem}>4. Remove EasySpot from the list</Text>
          <Text style={styles.listItem}>
            5. Also: Settings → Apps → EasySpot
          </Text>
          <Text style={styles.listItem}>
            6. Battery → Select "Unrestricted"
          </Text>
        </>
      );
    }

    return (
      <>
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
          📱 Instructions for your device:
        </Text>
        <Text style={styles.listItem}>1. Open Settings</Text>
        <Text style={styles.listItem}>2. Battery → Battery Optimization</Text>
        <Text style={styles.listItem}>3. Find EasySpot</Text>
        <Text style={styles.listItem}>
          4. Select "Don't optimize" or "No restrictions"
        </Text>
        <Text style={styles.listItem}>
          5. If you have an "Auto-start" setting, enable it
        </Text>
      </>
    );
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>⚙️ Battery settings</Text>

        <Text style={styles.deviceInfo}>
          Your device: {deviceInfo.manufacturer} {deviceInfo.model}
        </Text>

        {/* <Text style={styles.sectionTitle}>Защо е необходимо?</Text> */}
        <Text style={styles.paragraph}>
          {deviceInfo.manufacturer} There is aggressive battery management that
          may prevent EasySpot to send parking reminder. To get reliable
          reminders, you need to change the settings.
        </Text>

        <Text style={styles.sectionTitle}>How to set up?</Text>
        <Text style={styles.paragraph}>
          Follow these steps for your device:
        </Text>

        <Text style={styles.listItem}>1. Open Phone Settings</Text>
        <Text style={styles.listItem}>
          2. Go to Battery or Battery Management
        </Text>
        <Text style={styles.listItem}>
          3. Find EasySpot in the list of applications
        </Text>
        <Text style={styles.listItem}>4. Allow:</Text>
        <Text style={styles.subListItem}> • Automatic start</Text>
        <Text style={styles.subListItem}> • Working in background mode</Text>
        <Text style={styles.subListItem}> • No battery limitations</Text>
        <Text style={styles.listItem}>5. Lock the app in Recent Apps</Text>

        {getBatteryInstructions()}

        <Text style={styles.footer}>
          ⚠️ Critical: Battery optimization affects background reminders
        </Text>
        <Text style={styles.footerDetail}>
          • Without setup: Reminders work ONLY when app is open
        </Text>
        <Text style={styles.footerDetail}>
          • With setup: Reminders work even when app is closed
        </Text>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 10,
  },
  deviceInfo: {
    fontWeight: "700",
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginLeft: 10,
    marginBottom: 4,
  },
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
  footer: {
    marginTop: 20,
    fontSize: 12,
    textAlign: "center",
    color: colors.muted,
    marginBottom: 8,
  },
  footerDetail: {
    fontSize: 12,
    color: colors.muted,
    marginLeft: 10,
    marginBottom: 4,
  },
});

export default BatteryOptimizationScreenComponent;
