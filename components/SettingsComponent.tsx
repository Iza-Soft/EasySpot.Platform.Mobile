import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../themes/main";

const screenHeight = Dimensions.get("window").height;
export default function SettingsComponent({
  visible,
  onClose,
  onPrivacyView,
  onTermsView,
  onAboutView,
}: any) {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current; // starts off-screen
  const [isMounted, setIsMounted] = useState(false); // ✅ Track mounting state

  useEffect(() => {
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
          <Text style={styles.headerText}>Settings</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.tab} />
          </TouchableOpacity>
        </View>

        {/* Privacy & Tearms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Terms</Text>

          <TouchableOpacity style={styles.item} onPress={onPrivacyView}>
            <Text style={styles.emoji}>🛡️</Text>
            <Text style={styles.itemText}>Privacy policy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onTermsView}>
            <Text style={styles.emoji}>📄</Text>
            <Text style={styles.itemText}>Terms of service</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.item} onPress={onAboutView}>
            <Text style={styles.emoji}>ℹ️</Text>
            <Text style={styles.itemText}>About Easy Spot</Text>
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.emoji}>🌙</Text>
            <Text style={styles.itemText}>Dark Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.emoji}>🌐</Text>
            <Text style={styles.itemText}>Language</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.emoji}>🔔</Text>
            <Text style={styles.itemText}>Notifications</Text>
          </TouchableOpacity>
        </View> */}

        {/* Data & Storage */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.emoji}>☁️</Text>
            <Text style={styles.itemText}>Backup Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.emoji}>🗑️</Text>
            <Text style={styles.itemText}>Clear Cache</Text>
          </TouchableOpacity>
        </View> */}

        {/* 💎 Subscription */}
        {/* <View style={styles.subscriptionSection}>
          <Text style={styles.sectionTitle}>Subscription</Text>

          <TouchableOpacity style={styles.subscriptionCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "column", flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.emoji}>⭐</Text>
                  <Text style={styles.subscriptionTitle}>
                    Easy Spot Premium
                  </Text>
                </View>

                <Text style={styles.subscriptionDesc}>
                  Unlock unlimited saves, cloud backup, and early access 🚀
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={22} color={colors.tab} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.emoji}>💳</Text>
            <Text style={styles.itemText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View> */}

        {/* About */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.emoji}>ℹ️</Text>
            <Text style={styles.itemText}>About Easy Spot</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.emoji}>💬</Text>
            <Text style={styles.itemText}>Contact Support</Text>
          </TouchableOpacity>
        </View> */}
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
  headerText: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 10,
  },
  // 💎 Subscription Styles
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
