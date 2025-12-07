import { Pressable, View, Text, StyleSheet } from "react-native";
import { colors } from "../themes/main";
import { SlideCardProps } from "../types/props";

export function SlideCardComponent({ item, onPress }: SlideCardProps) {
  return (
    <Pressable
      onPress={() => onPress(item.action)}
      disabled={item.disabled}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <Text style={styles.cardDesc}>{item.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  emoji: {
    fontSize: 26,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
});
