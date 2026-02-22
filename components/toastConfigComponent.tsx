import {
  BaseToast,
  ToastConfig,
  ToastConfigParams,
} from "react-native-toast-message";
import { StyleSheet } from "react-native";
import { colors } from "../themes/main";

export const toastConfigComponent: ToastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      style={[styles.toastBase, { borderLeftColor: colors.success }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      text1NumberOfLines={0} // Позволява неограничен брой редове за text1
      text2NumberOfLines={0} // Позволява неограничен брой редове за text2
    />
  ),

  error: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      style={[styles.toastBase, { borderLeftColor: colors.error }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      text1NumberOfLines={0}
      text2NumberOfLines={0}
    />
  ),

  info: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      style={[styles.toastBase, { borderLeftColor: colors.info }]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      text1NumberOfLines={0}
      text2NumberOfLines={0}
    />
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
    //paddingVertical: 3,
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
    marginTop: 2, // Малко разстояние между title и message
  },
});
