import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { CardItem, Scheduler } from "../types/common";
import { useSQLiteContext } from "expo-sqlite";
import { useTimer } from "../hook/useTimer";
import { useTranslation } from "react-i18next";
import { typography } from "../themes/typography";
import AppText from "./AppTextComponent";

const screenHeight = Dimensions.get("window").height;
export default function LocationCardOptionsComponent({
  item,
  visible,
  onClose,
  onShare,
  onDelete,
  onNavigate,
  onViewDetails,
  onUpdateDetails,
  onCopyCoordinates,
  onCopyAddress,
  onAdjustParkingDuration,
}: any) {
  const { t: localize } = useTranslation();
  const database = useSQLiteContext();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [isMounted, setIsMounted] = useState(false);

  const shouldShowActiveTimer =
    (item as CardItem)?.isActive !== null &&
    (item as CardItem)?.type === "parking";

  const scheduler = useMemo<Scheduler | null>(() => {
    if ((item as CardItem) === null) return null;

    if (
      shouldShowActiveTimer &&
      (item as CardItem).schedulerId !== undefined &&
      (item as CardItem).schedulerId !== null
    ) {
      return {
        id: (item as CardItem).schedulerId,
        locationId: (item as CardItem).locationId,
        startTime: (item as CardItem).startTime,
        durationMinutes: (item as CardItem).durationMinutes,
        endTime: (item as CardItem).endTime,
        notifyBeforeMinutes: (item as CardItem).notifyBeforeMinutes,
        notificationSent: (item as CardItem).notificationSent,
        isActive: (item as CardItem).isActive,
      };
    }
    return null;
  }, [item as CardItem]);

  const timer = useTimer({ database, scheduler });

  const hasActiveTimer = Boolean(
    (scheduler?.isActive ?? false) && !timer.isExpired,
  );

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
          <AppText style={styles.headerText}>
            {(item as CardItem).title?.trim() || localize("common.no_title")}
          </AppText>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.tab} />
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          {/* GENERAL */}
          <AppText style={styles.sectionTitle}>
            {localize("card_options.sections.location_tools")}
          </AppText>

          <TouchableOpacity style={styles.item} onPress={onViewDetails}>
            <AppText style={styles.emoji}>🔎</AppText>
            <View>
              <AppText style={styles.itemText}>
                {localize("card_options.actions.view_details")}
              </AppText>
              <AppText style={styles.itemSubText}>
                {localize("card_options.actions.view_details_sub")}
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onUpdateDetails}>
            <AppText style={styles.emoji}>✏️</AppText>
            <View>
              <AppText style={styles.itemText}>
                {localize("card_options.actions.edit_details")}
              </AppText>
              <AppText style={styles.itemSubText}>
                {localize("card_options.actions.edit_details_sub")}
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onNavigate}>
            <AppText style={styles.emoji}>🗺️</AppText>
            <View>
              <AppText style={styles.itemText}>
                {localize("card_options.actions.open_maps")}
              </AppText>
              <AppText style={styles.itemSubText}>
                {localize("card_options.actions.open_maps_sub")}
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onCopyCoordinates}>
            <AppText style={styles.emoji}>📍</AppText>
            <View>
              <AppText style={styles.itemText}>
                {localize("card_options.actions.copy_coordinates")}
              </AppText>
              <AppText style={styles.itemSubText}>
                {localize("card_options.actions.copy_coordinates_sub")}
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onCopyAddress}>
            <AppText style={styles.emoji}>📋</AppText>
            <View>
              <AppText style={styles.itemText}>
                {localize("card_options.actions.copy_address")}
              </AppText>
              <AppText style={styles.itemSubText}>
                {localize("card_options.actions.copy_address_sub")}
              </AppText>
            </View>
          </TouchableOpacity>

          {/* SHARE */}
          <AppText style={[styles.sectionTitle, { marginTop: 12 }]}>
            {localize("card_options.sections.share")}
          </AppText>

          <TouchableOpacity style={styles.item} onPress={onShare}>
            <AppText style={styles.emoji}>📤</AppText>
            <View>
              <AppText style={styles.itemText}>
                {localize("card_options.actions.share_location")}
              </AppText>
              <AppText style={styles.itemSubText}>
                {localize("card_options.actions.share_location_sub")}
              </AppText>
            </View>
          </TouchableOpacity>

          {/* REMINDER */}
          {shouldShowActiveTimer && (
            <>
              <View style={styles.reminderHeader}>
                <AppText style={[styles.sectionTitle, { marginTop: 12 }]}>
                  {localize("card_options.sections.reminder")}
                </AppText>

                <View style={[styles.timerInline, { marginTop: 16 }]}>
                  <AppText
                    style={[
                      styles.timerTextInline,
                      timer.isExpired && styles.expiredTimer,
                    ]}
                  >
                    ⏱️ {timer.formattedTime}
                  </AppText>
                  {timer.isExpired ?
                    <AppText style={styles.expiredTextInline}>
                      {localize("card_options.timer.expired")}
                    </AppText>
                  : <AppText style={styles.remainingTextInline}>
                      {localize("card_options.timer.remaining")}
                    </AppText>
                  }
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.item,
                  !hasActiveTimer && styles.disabledItem, // Добави стил за disabled
                ]}
                onPress={(event) => {
                  event.stopPropagation();
                  if (!hasActiveTimer) return;
                  onAdjustParkingDuration();
                }}
                activeOpacity={!hasActiveTimer ? 1 : 0.2}
              >
                <AppText
                  style={[styles.emoji, !hasActiveTimer && styles.disabledText]}
                >
                  🔀
                </AppText>
                <View>
                  <AppText
                    style={[
                      styles.itemText,
                      !hasActiveTimer && styles.disabledText,
                    ]}
                  >
                    {/* Adjust parking time */}
                    {localize("card_options.actions.parking_duration")}
                  </AppText>
                  <AppText
                    style={[
                      styles.itemSubText,
                      !hasActiveTimer && styles.disabledText,
                    ]}
                  >
                    {localize("card_options.actions.parking_duration_sub")}
                  </AppText>
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* DANGER ZONE */}
          <AppText
            style={[
              styles.sectionTitle,
              { marginTop: 12, color: colors.danger },
            ]}
          >
            {localize("card_options.sections.danger_zone")}
          </AppText>

          <TouchableOpacity style={styles.item} onPress={onDelete}>
            <AppText style={[styles.emoji, { color: colors.danger }]}>
              🗑️
            </AppText>
            <View>
              <AppText style={[styles.itemText, { color: colors.danger }]}>
                {localize("card_options.actions.delete_location")}
              </AppText>
              <AppText style={[styles.itemSubText, { color: colors.danger }]}>
                {localize("card_options.actions.delete_location_sub")}
              </AppText>
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
  headerText: typography.headerLarge,
  section: {
    marginTop: 20,
  },
  sectionTitle: typography.sectionTitle,
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemText: typography.itemText,
  emoji: {
    fontSize: 16,
    marginRight: 5,
  },
  itemSubText: typography.itemSubText,
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerInline: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerTextInline: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  expiredTimer: {
    color: "#dc2626",
  },
  expiredTextInline: {
    fontSize: 11,
    color: "#dc2626",
    marginLeft: 4,
  },
  remainingTextInline: {
    fontSize: 11,
    color: colors.muted,
    marginLeft: 4,
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.muted || "#999",
  },
});
