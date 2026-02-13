import { useEffect, useRef } from "react";
import { Pressable, View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../themes/main";
import { SlideCardProps } from "../types/props";

export function SlideCardComponent({ item, onPress }: SlideCardProps) {
  const contentOpacity = item.disabled ? 0.6 : 1;

  // 🔒 lock animation
  const lockAnim = useRef(new Animated.Value(item.disabled ? 1 : 0)).current;

  // 🔥 card pulse scale
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Track previous state
  const wasDisabled = useRef(item.disabled);

  // Lock icon animation
  useEffect(() => {
    Animated.spring(lockAnim, {
      toValue: item.disabled ? 1 : 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [item.disabled]);

  // 🔥 Pulse when card becomes enabled
  useEffect(() => {
    if (wasDisabled.current && !item.disabled) {
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.03,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(pulseScale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }

    wasDisabled.current = item.disabled;
  }, [item.disabled]);

  return (
    <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
      <Pressable
        onPress={() => onPress(item.action)}
        disabled={item.disabled}
        pointerEvents={item.disabled ? "none" : "auto"}
        style={({ pressed }) => [
          styles.card,
          pressed && !item.disabled && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.left, { opacity: contentOpacity }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>

          {/* 🔒 animated lock */}
          <Animated.View
            style={{
              opacity: lockAnim,
              transform: [
                {
                  scale: lockAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
            }}
            pointerEvents="none"
          >
            <Ionicons name="lock-closed" size={18} color={colors.muted} />
          </Animated.View>
        </View>

        <Text style={[styles.cardDesc, { opacity: contentOpacity }]}>
          {item.description}
        </Text>
      </Pressable>
    </Animated.View>
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
    justifyContent: "space-between",
    marginBottom: 6,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
