import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/tokens";
import { Text } from "../../ui";

const RING = 276;
const BUTTON = 224;
const PERIOD = 2400;

/**
 * The big PARK button. Two soft Volt waves leave the button and the button
 * itself "breathes", inviting the tap. Runs on the native driver, pauses when
 * the screen is not visible, and stays still when the OS asks for reduced motion.
 */
export function ParkButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const focused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState(false);
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!focused || reduceMotion) {
      wave1.setValue(0);
      wave2.setValue(0);
      breath.setValue(0);
      return;
    }
    // Each wave lasts one PERIOD; the second starts half a period later.
    const wave = (v: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: PERIOD, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ),
      ]);
    const anim = Animated.parallel([
      wave(wave1, 0),
      wave(wave2, PERIOD / 2),
      Animated.loop(
        Animated.sequence([
          Animated.timing(breath, { toValue: 1, duration: PERIOD / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(breath, { toValue: 0, duration: PERIOD / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    ]);
    anim.start();
    return () => anim.stop();
  }, [focused, reduceMotion, wave1, wave2, breath]);

  const waveStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 0.5, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.32] }) }],
  });
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });

  return (
    <View style={[styles.ring, { borderColor: colors.border }]}>
      {!reduceMotion && (
        <>
          <Animated.View pointerEvents="none" style={[styles.wave, { backgroundColor: colors.accent }, waveStyle(wave1)]} />
          <Animated.View pointerEvents="none" style={[styles.wave, { backgroundColor: colors.accent }, waveStyle(wave2)]} />
        </>
      )}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("v2.save.title_parking")}
          onPress={onPress}
          style={({ pressed }) => [styles.park, { backgroundColor: pressed ? colors.accentPressed : colors.accent }]}
        >
          <Ionicons name="location-outline" size={34} color={colors.onAccent} />
          <Text variant="title" tone="onAccent" style={styles.parkLabel} numberOfLines={1} adjustsFontSizeToFit>
            {t("v2.park.park")}
          </Text>
          <Text variant="overline" tone="onAccent" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {t("v2.park.park_sub")}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  wave: {
    position: "absolute",
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
  },
  park: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  parkLabel: { fontSize: 40, lineHeight: 46 },
});
