import { Pressable, View, Text, StyleSheet, Animated } from "react-native";
import { useEffect, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../themes/main";
import { SlideCardProps } from "../types/props";

const ICON_COLORS: Record<string, { bg: string }> = {
  parking: { bg: "#e6fbfa" },
  navigate: { bg: "#f3f4f6" },
  favorites: { bg: "#fefce8" },
  history: { bg: "#f0fdf4" },
  share: { bg: "#eff6ff" },
};

export function SlideCardComponent({
  item,
  onPress,
  isFullWidth,
}: SlideCardProps & { isFullWidth?: boolean }) {
  const contentOpacity = item.disabled ? 0.45 : 1;
  const lockAnim = useRef(new Animated.Value(item.disabled ? 1 : 0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const wasDisabled = useRef(item.disabled);

  const lockStyle = useMemo(
    () => ({
      opacity: lockAnim,
      transform: [
        {
          scale: lockAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1],
          }),
        },
      ],
    }),
    [lockAnim],
  );

  useEffect(() => {
    Animated.spring(lockAnim, {
      toValue: item.disabled ? 1 : 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [item.disabled]);

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

  const iconBg = ICON_COLORS[item.action]?.bg ?? "#f3f4f6";

  if (isFullWidth) {
    return (
      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <Pressable
          onPress={() => onPress(item.action)}
          disabled={item.disabled}
          style={({ pressed }) => [
            styles.cardRow,
            pressed && !item.disabled && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <View
            style={[
              styles.iconBox,
              { backgroundColor: iconBg, opacity: contentOpacity },
            ]}
          >
            <Text style={styles.iconEmoji}>{item.emoji}</Text>
          </View>
          <View style={[{ flex: 1 }, { opacity: contentOpacity }]}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
          </View>
          <Animated.View style={lockStyle} pointerEvents="none">
            <Ionicons name="lock-closed" size={15} color={colors.muted} />
          </Animated.View>
          {!item.disabled && (
            <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
          )}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale: pulseScale }], flex: 1 }]}>
      <Pressable
        onPress={() => onPress(item.action)}
        disabled={item.disabled}
        style={({ pressed }) => [
          styles.cardGrid,
          pressed && !item.disabled && { transform: [{ scale: 0.96 }] },
        ]}
      >
        <View
          style={[
            styles.iconBox,
            { backgroundColor: iconBg },
            { opacity: contentOpacity },
          ]}
        >
          <Text style={styles.iconEmoji}>{item.emoji}</Text>
        </View>
        <View style={{ opacity: contentOpacity }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc}>{item.description}</Text>
        </View>
        <Animated.View
          style={[lockStyle, { position: "absolute", top: 12, right: 12 }]}
          pointerEvents="none"
        >
          <Ionicons name="lock-closed" size={15} color={colors.muted} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardGrid: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flex: 1,
  },
  cardRow: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iconEmoji: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.muted,
  },
});
