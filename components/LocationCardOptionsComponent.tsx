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
export default function LocationCardOptionsComponent({
  title,
  visible,
  onClose,
  onShare,
  onDelete,
  onNavigate,
  onViewDetails,
  onUpdateDetails,
  onCopyCoordinates,
  onCopyAddress,
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
          <Text style={styles.headerText}>{title?.trim() || "(No title)"}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.tab} />
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          {/* GENERAL */}
          <Text style={styles.sectionTitle}>Location Tools</Text>

          <TouchableOpacity style={styles.item} onPress={onViewDetails}>
            <Text style={styles.emoji}>🔎</Text>
            <View>
              <Text style={styles.itemText}>View Details</Text>
              <Text style={styles.itemSubText}>See saved location details</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onUpdateDetails}>
            <Text style={styles.emoji}>✏️</Text>
            <View>
              <Text style={styles.itemText}>Edit Details</Text>
              <Text style={styles.itemSubText}>
                Modify saved location details
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onNavigate}>
            <Text style={styles.emoji}>🗺️</Text>
            <View>
              <Text style={styles.itemText}>Open in Maps</Text>
              <Text style={styles.itemSubText}>Navigate to this location</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onCopyCoordinates}>
            <Text style={styles.emoji}>📍</Text>
            <View>
              <Text style={styles.itemText}>Copy Coordinates</Text>
              <Text style={styles.itemSubText}>
                Latitude & longitude to clipboard
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onCopyAddress}>
            <Text style={styles.emoji}>📋</Text>
            <View>
              <Text style={styles.itemText}>Copy Address</Text>
              <Text style={styles.itemSubText}>Copy formatted address</Text>
            </View>
          </TouchableOpacity>

          {/* SHARE */}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Share</Text>

          <TouchableOpacity style={styles.item} onPress={onShare}>
            <Text style={styles.emoji}>📤</Text>
            <View>
              <Text style={styles.itemText}>Share Location</Text>
              <Text style={styles.itemSubText}>
                Send this location via apps
              </Text>
            </View>
          </TouchableOpacity>

          {/* DANGER ZONE */}
          <Text
            style={[
              styles.sectionTitle,
              { marginTop: 12, color: colors.danger },
            ]}
          >
            Danger Zone
          </Text>

          <TouchableOpacity style={styles.item} onPress={onDelete}>
            <Text style={[styles.emoji, { color: colors.danger }]}>🗑️</Text>
            <View>
              <Text style={[styles.itemText, { color: colors.danger }]}>
                Delete Location
              </Text>
              <Text style={[styles.itemSubText, { color: colors.danger }]}>
                Remove this location permanently
              </Text>
            </View>
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
    paddingVertical: 8,
  },
  itemText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 10,
  },
  emoji: {
    fontSize: 16,
    marginRight: 5,
  },
  itemSubText: { fontSize: 12, color: colors.muted, marginLeft: 10 },
});
