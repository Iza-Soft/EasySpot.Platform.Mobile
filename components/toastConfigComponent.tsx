import { View, Text, StyleSheet } from "react-native";
import { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { colors } from "../themes/main";

const ToastContent = ({
  text1,
  text2,
  borderColor,
}: {
  text1?: string;
  text2?: string;
  borderColor: string;
}) => (
  <View style={[styles.toastBase, { borderLeftColor: borderColor }]}>
    <View style={styles.contentContainer}>
      {text1 && (
        <Text
          style={styles.title}
          maxFontSizeMultiplier={1.0}
          numberOfLines={0}
        >
          {text1}
        </Text>
      )}
      {text2 && (
        <Text
          style={styles.message}
          maxFontSizeMultiplier={1.0}
          numberOfLines={0}
        >
          {text2}
        </Text>
      )}
    </View>
  </View>
);

export const toastConfigComponent: ToastConfig = {
  success: ({ text1, text2 }: ToastConfigParams<any>) => (
    <ToastContent text1={text1} text2={text2} borderColor={colors.success} />
  ),
  error: ({ text1, text2 }: ToastConfigParams<any>) => (
    <ToastContent text1={text1} text2={text2} borderColor={colors.error} />
  ),
  info: ({ text1, text2 }: ToastConfigParams<any>) => (
    <ToastContent text1={text1} text2={text2} borderColor={colors.info} />
  ),
  warning: ({ text1, text2 }: ToastConfigParams<any>) => (
    <ToastContent text1={text1} text2={text2} borderColor={colors.warning} />
  ),
};

const styles = StyleSheet.create({
  toastBase: {
    borderLeftWidth: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    paddingHorizontal: 15,
    maxWidth: 500,
    alignSelf: "center",
    minWidth: 200,
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.tab,
    flexWrap: "nowrap",
  },
  message: {
    fontSize: 13,
    color: colors.muted,
    flexWrap: "nowrap",
    marginTop: 2,
  },
});
