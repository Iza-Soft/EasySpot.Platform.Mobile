import {
  BaseToast,
  ErrorToast,
  ToastConfig,
  ToastConfigParams,
} from "react-native-toast-message";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../themes/main";

export const toastConfig: ToastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      style={[styles.toastBase, { borderLeftColor: colors.success }]}
      text1Style={styles.title}
      text2Style={styles.message}
    />
  ),

  error: (props: ToastConfigParams<any>) => (
    <ErrorToast
      {...props}
      style={[styles.toastBase, { borderLeftColor: colors.error }]}
      text1Style={styles.title}
      text2Style={styles.message}
    />
  ),

  info: (props: ToastConfigParams<any>) => {
    const { text1, text2 } = props;
    return (
      <View style={[styles.toastBase, { borderLeftColor: colors.info }]}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    );
  },
};

const styles = StyleSheet.create({
  toastBase: {
    borderLeftWidth: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.tab,
  },
  message: {
    fontSize: 13,
    color: colors.muted,
  },
});
