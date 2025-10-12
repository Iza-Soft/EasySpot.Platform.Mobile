import { Pressable, View, Text, StyleSheet } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { colors } from "../themes/main";
import { LocationCardProps } from "../types/props";

export default function LocationItemCard({
  item,
  onPress,
  onLongPress,
}: LocationCardProps) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item.id)}
    >
      <View style={styles.row}>
        <View style={styles.leftRow}>
          <Text style={styles.emoji}>📍</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {item.street || "Unnamed Street"},{" "}
              {item.city || item.region || ""}
            </Text>
            <Text style={styles.subtitle}>
              {formatDistanceToNow(new Date(item.timestamp), {
                addSuffix: true,
              })}
            </Text>
          </View>
        </View>
        <Text style={styles.emoji}>
          {item.type === "favorites"
            ? "⭐️"
            : item.type === "parking"
            ? "🚙"
            : "📌"}
        </Text>
      </View>
    </Pressable>
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
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  textContainer: {
    marginLeft: 8,
    flexShrink: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
});
