import { NavigationProp, useNavigation } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import type { RootStackParamList } from "../navigation/types";
import { spacing, touchTarget } from "../theme/tokens";
import { Logo } from "./Logo";
import { Text } from "./Text";

/** The EasySpot mark + name. Tapping it goes to Home (Park tab) from anywhere. */
export function HomeLogo({ size = 32, onLongPress }: { size?: number; onLongPress?: () => void }) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("v2.common.go_home")}
      hitSlop={8}
      onPress={() => navigation.navigate("Tabs", { screen: "Park" })}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Logo size={size} />
      <Text variant="action" style={{ letterSpacing: 1.5 }}>EASYSPOT</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: touchTarget, alignSelf: "flex-start" },
});
