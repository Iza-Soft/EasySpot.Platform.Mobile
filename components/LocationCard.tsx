import { Pressable, View, Text, StyleSheet } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { colors } from "../themes/main";
import { LocationCardProps } from "../types/props";
import { useTimer } from "../hook/useTimer";
import { Scheduler } from "../types/common";
import { useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";

export default function LocationItemCard({
  item,
  isMultiSelectMode,
  isSelected,
  onPress,
  onLongPress,
}: LocationCardProps) {
  const database = useSQLiteContext();
  const scheduler = useMemo<Scheduler | null>(() => {
    if (item.schedulerId !== undefined && item.schedulerId !== null) {
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
  const hasActiveTimer = scheduler && scheduler.isActive;
  console.log(timer);
  console.log(hasActiveTimer);
  return (
    <>
      <Pressable
        style={styles.card}
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress(item.id)}
      >
        <View style={styles.row}>
          <View style={styles.leftRow}>
            <Text style={styles.emoji}>
              {item.type === "favorites" ? "⭐️" : "🚙"}
            </Text>
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {item.title?.trim() || "(No title)"}
              </Text>
              <Text style={styles.address}>
                {item.street || "Unnamed Street"},{" "}
                {item.city || item.region || ""}, {item.postalCode || ""},{" "}
                {item.country || ""}
              </Text>

              <View style={styles.timeRow}>
                <Text style={styles.time}>
                  {formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                  })}
                </Text>
                {item.isActive !== null && (
                  <View style={styles.timerInline}>
                    <Text
                      style={[
                        styles.timerTextInline,
                        timer.isExpired && styles.expiredTimer,
                      ]}
                    >
                      ⏱️ {timer.formattedTime}
                    </Text>
                    {timer.isExpired ? (
                      <Text style={styles.expiredTextInline}>(Expired)</Text>
                    ) : (
                      <Text style={styles.remainingTextInline}>
                        (remaining)
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            {isMultiSelectMode && (
              <Text style={styles.checkbox}>{isSelected ? "☑️" : "⬜️"}</Text>
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
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  time: {
    fontSize: 13,
    color: colors.muted,
  },
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
