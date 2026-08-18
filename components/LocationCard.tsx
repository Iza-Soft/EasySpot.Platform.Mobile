import { Pressable, View, Text, StyleSheet } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { colors } from "../themes/main";
import { LocationCardProps } from "../types/props";
import { useTimer } from "../hook/useTimer";
import { Scheduler } from "../types/common";
import { useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useTranslation } from "react-i18next";
import { typography } from "../themes/typography";
import AppText from "./AppTextComponent";

export default function LocationItemCard({
  item,
  isMultiSelectMode,
  isSelected,
  onPress,
  onLongPress,
}: LocationCardProps) {
  const { t: localize } = useTranslation();
  const database = useSQLiteContext();
  const shouldShowTimer = item.type === "parking";

  const scheduler = useMemo<Scheduler | null>(() => {
    if (
      shouldShowTimer &&
      item.schedulerId !== undefined &&
      item.schedulerId !== null
    ) {
      return {
        id: item.schedulerId,
        locationId: item.locationId,
        startTime: item.startTime,
        durationMinutes: item.durationMinutes,
        endTime: item.endTime,
        notifyBeforeMinutes: item.notifyBeforeMinutes,
        notificationSent: item.notificationSent,
        isActive: item.isActive,
      };
    }
    return null;
  }, [
    shouldShowTimer,
    item.schedulerId,
    item.locationId,
    item.startTime,
    item.durationMinutes,
    item.endTime,
    item.notifyBeforeMinutes,
    item.notificationSent,
    item.isActive,
  ]);

  const timer = useTimer({ database, scheduler });
  const hasActiveTimer =
    item.isActive !== null || (scheduler && scheduler.isActive);

  return (
    <>
      <Pressable
        style={styles.card}
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress(item.id)}
      >
        <View style={styles.row}>
          <View style={styles.leftRow}>
            <AppText style={styles.emoji}>
              {item.type === "favorites" ? "⭐️" : "🚙"}
            </AppText>
            <View style={styles.textContainer}>
              <AppText style={styles.title}>
                {item.title?.trim() || localize("common.no_title")}
              </AppText>
              <AppText style={styles.address}>
                {item.street || localize("common.unnamed_street")},{" "}
                {item.city || item.region || ""}, {item.postalCode || ""},{" "}
                {item.country || ""}
              </AppText>

              <View style={styles.timeRow}>
                <AppText style={styles.time}>
                  {formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                  })}
                </AppText>
                {shouldShowTimer && hasActiveTimer && (
                  <View style={styles.timerInline}>
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
                )}
              </View>
            </View>
            {isMultiSelectMode && (
              <AppText style={styles.checkbox}>
                {isSelected ? "☑️" : "⬜️"}
              </AppText>
            )}
          </View>
        </View>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    flex: 1,
  },
  textContainer: {
    marginLeft: 8,
    flexShrink: 1,
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  title: { ...typography.cardTitle, fontSize: 16 },
  address: { ...typography.bodySmall, fontWeight: "600" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  time: typography.cardDesc,
  timerInline: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
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
  checkbox: {
    fontSize: 16,
    marginLeft: "auto",
  },
});
