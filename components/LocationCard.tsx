import { Pressable, View, Text, StyleSheet } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { colors } from "../themes/main";
import { LocationCardProps } from "../types/props";
import { CardItem } from "../types/common";

export default function LocationItemCard({
  item,
  onPress,
  onLongPress,
}: LocationCardProps) {
  const details = [
    item.level ? `Level: ${item.level}` : null,
    item.section ? `Section: ${item.section}` : null,
    item.spot ? `Spot: ${item.spot}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const onSeeComments = (item: CardItem) => {
    alert(item.comments);
  };
  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item.id)}
    >
      <View style={styles.row}>
        <View style={styles.leftRow}>
          <Text style={styles.emoji}>📌</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {item.title?.trim() || "(No title)"}
            </Text>
            {item.type === "parking" && (
              <View style={styles.inlineRow}>
                {details && (
                  <Text style={styles.park_details}>
                    {details.length > 30
                      ? details.slice(0, 35) + " ..."
                      : details}
                  </Text>
                )}
                {details && (
                  <Text
                    style={styles.comments}
                    onPress={() => onSeeComments(item)}
                  >
                    see more
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.address}>
              {item.street || "Unnamed Street"},{" "}
              {item.city || item.region || ""}, {item.country || ""}
            </Text>
            <Text style={styles.time}>
              {formatDistanceToNow(new Date(item.timestamp), {
                addSuffix: true,
              })}
            </Text>
          </View>
        </View>
        <Text style={styles.emoji}>
          {item.type === "favorites" ? "⭐️" : "🚙"}
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
    marginBottom: 2,
  },

  address: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  park_details: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  time: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  comments: {
    marginLeft: 10,
    color: colors.tab,
    fontSize: 14,
    fontWeight: "600",
  },
  inlineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
  },
});
