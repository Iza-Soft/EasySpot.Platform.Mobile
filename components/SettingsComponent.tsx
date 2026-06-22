import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../themes/main";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotifications } from "../hook/useNotifications";
import { useTranslation } from "react-i18next";
import { typography } from "../themes/typography";

const screenHeight = Dimensions.get("window").height;
export default function SettingsComponent({
  visible,
  onClose,
  onPrivacyView,
  onTermsView,
  onAboutView,
  onBatteryOptimizationView,
}: any) {
  const { t: localize } = useTranslation();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current; // starts off-screen
  const [isMounted, setIsMounted] = useState(false); // ✅ Track mounting state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const { requestNotificationPermission, checkNotificationPermission } =
    useNotifications();

  const onReminderValueToggle = async (value: boolean) => {
    if (value) {
      const hasPermission = await checkNotificationPermission();
      if (!hasPermission) {
        value = await requestNotificationPermission(true);
      }
    }
    await AsyncStorage.setItem("@reminder_enabled", JSON.stringify(value));
    setReminderEnabled(value);
  };

  const loadSettings = async () => {
    const reminder_enabled = await AsyncStorage.getItem("@reminder_enabled");
    if (reminder_enabled) {
      setReminderEnabled(JSON.parse(reminder_enabled));
    }
  };

  useEffect(() => {
    loadSettings();

    if (visible) {
      setIsMounted(true); // ✅ Mount when visible becomes true

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else if (isMounted) {
      // ✅ Run closing animation before unmounting
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setIsMounted(false); // ✅ Unmount AFTER animation ends
        onClose?.();
      });
    }
  }, [visible]);

  if (!isMounted) return null; // ✅ Prevent early unmount before animation ends

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>{localize("settings.title")}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.tab} />
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {localize("settings.sections.preferences")}
          </Text>

          <View style={styles.itemWithSwitch}>
            <View style={styles.itemLeft}>
              <Text style={styles.emoji}>🔔</Text>
              <Text style={styles.itemText}>
                {localize("settings.items.reminder")}
              </Text>
            </View>
            <Switch
              value={reminderEnabled} // ← false по подразбиране
              onValueChange={async (value) =>
                await onReminderValueToggle(value)
              }
              trackColor={{ false: "#767577", true: colors.tab }}
              thumbColor={reminderEnabled ? "#fff" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        {/* Privacy & Tearms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {localize("settings.sections.privacy")}
          </Text>

          <TouchableOpacity style={styles.item} onPress={onPrivacyView}>
            <Text style={styles.emoji}>🛡️</Text>
            <Text style={styles.itemText}>
              {localize("settings.items.privacy_policy")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onTermsView}>
            <Text style={styles.emoji}>📄</Text>
            <Text style={styles.itemText}>
              {localize("settings.items.terms_of_service")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {localize("settings.sections.device")}
          </Text>

          <TouchableOpacity
            style={styles.item}
            onPress={onBatteryOptimizationView}
          >
            <Text style={styles.emoji}>⚡</Text>
            <Text style={styles.itemText}>
              {localize("settings.items.battery_optimization")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <Text style={styles.sectionTitle}>
            {localize("settings.sections.about")}
          </Text>

          <TouchableOpacity style={styles.item} onPress={onAboutView}>
            <Text style={styles.emoji}>ℹ️</Text>
            <Text style={styles.itemText}>
              {localize("settings.items.about")}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerText: typography.headerLarge,
  section: {
    marginTop: 20,
  },
  sectionTitle: typography.sectionTitle,
  itemWithSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemText: typography.itemText,
  subscriptionSection: {
    marginTop: 25,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eaeaea",
  },
  subscriptionCard: {
    backgroundColor: "#EAF7FF",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  subscriptionDesc: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 3,
  },
  emoji: {
    fontSize: 16,
    marginRight: 5,
  },
});
