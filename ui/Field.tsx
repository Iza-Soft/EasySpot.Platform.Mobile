import React, { forwardRef } from "react";
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../theme/tokens";
import { Text } from "./Text";

interface FieldProps extends TextInputProps {
  label: string;
  /** Big display-font value (Level / Zone / Spot). */
  metric?: boolean;
  /** Label read by screen readers only (a group label is shown above instead). */
  hideLabel?: boolean;
  containerStyle?: ViewStyle;
}

/** Labelled text input in the app style. */
export const Field = forwardRef<TextInput, FieldProps>(function Field({ label, metric, hideLabel, containerStyle, style, ...rest }, ref) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, containerStyle]}>
      {hideLabel ? null : <Text variant="overline" tone="muted">{label}</Text>}
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accentFg}
        maxFontSizeMultiplier={metric ? 1 : 1.3}
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.border,
            color: colors.text,
            fontFamily: metric ? fontFamily.display : fontFamily.regular,
            fontSize: metric ? 20 : 16,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xxs },
  input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md },
});
