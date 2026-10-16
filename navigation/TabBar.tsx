import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { spacing } from "../theme/tokens";
import { Text } from "../ui";
import { useActiveParkingCount } from "../hook/useSpots";
import { isTabEnabled } from "./features";

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Park: ["location", "location-outline"],
  Spots: ["list", "list-outline"],
  Settings: ["options", "options-outline"],
};

/** Bottom bar: the active tab gets a Volt pill behind its icon. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const activeCount = useActiveParkingCount();

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.navBar, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const [on, off] = ICONS[route.name] ?? ["ellipse", "ellipse-outline"];
        const label = t(`v2.tabs.${route.name.toLowerCase()}`);
        const enabled = isTabEnabled(route.name);
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused, disabled: !enabled }}
            accessibilityLabel={route.name === "Spots" && activeCount > 0 ? `${label}, ${activeCount}` : label}
            accessibilityHint={enabled ? undefined : t("v2.common.soon")}
            disabled={!enabled}
            onPress={() => {
              const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={[styles.item, !enabled && styles.disabled]}
          >
            <View style={[styles.pill, focused && { backgroundColor: colors.accent }]}>
              <Ionicons name={focused ? on : off} size={20} color={focused ? colors.onAccent : colors.textMuted} />
              {route.name === "Spots" && activeCount > 0 ? (
                // How many parkings are active — visible from Home without changing Home.
                <View style={[styles.badge, { backgroundColor: focused ? colors.text : colors.accent }]}>
                  <Text variant="smallStrong" style={{ fontSize: 11, lineHeight: 14, color: focused ? colors.background : colors.onAccent }}>
                    {activeCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="smallStrong" style={{ fontSize: 12, lineHeight: 16, color: focused ? colors.text : colors.textMuted }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", borderTopWidth: 1, paddingTop: spacing.sm },
  item: { flex: 1, alignItems: "center", gap: 4, minHeight: 48 },
  disabled: { opacity: 0.35 },
  badge: {
    position: "absolute",
    top: -4,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: { width: 58, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
