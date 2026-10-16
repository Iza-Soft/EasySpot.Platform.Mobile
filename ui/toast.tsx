import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Toast, { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing } from "../theme/tokens";
import { Text } from "./Text";

/** props for type "undo": the button on the right (mockup E2). */
export interface ToastAction {
  actionLabel: string;
  onAction: () => void;
}

function ToastCard({ text1, text2, tone, props }: ToastConfigParams<unknown> & { tone: "ok" | "error" | "info" }) {
  const { colors } = useTheme();
  const dot = tone === "error" ? colors.alert : tone === "ok" ? colors.accentFg : colors.textMuted;
  const action = props as Partial<ToastAction> | undefined;
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <View style={{ flex: 1 }}>
        {text1 ? <Text variant="smallStrong">{text1}</Text> : null}
        {text2 ? <Text variant="small" tone="secondary">{text2}</Text> : null}
      </View>
      {action?.actionLabel && action.onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Toast.hide();
            action.onAction!();
          }}
          hitSlop={8}
          style={[styles.action, { borderColor: colors.accentFg }]}
        >
          <Text variant="smallStrong" tone="accent">{action.actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const config: ToastConfig = {
  success: (p) => <ToastCard {...p} tone="ok" />,
  error: (p) => <ToastCard {...p} tone="error" />,
  info: (p) => <ToastCard {...p} tone="info" />,
  warning: (p) => <ToastCard {...p} tone="error" />,
  undo: (p) => <ToastCard {...p} tone="ok" />,
};

/** Mount once inside ThemeProvider. Sits above the tab bar. */
export function ThemedToast() {
  return <Toast config={config} position="bottom" visibilityTime={3000} bottomOffset={104} />;
}

const styles = StyleSheet.create({
  card: {
    width: "90%",
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  action: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, justifyContent: "center" },
});
