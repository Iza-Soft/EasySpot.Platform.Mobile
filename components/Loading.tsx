import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { colors } from "../themes/main";

const Loading = ({ message }: { message: string }) => {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  loadingText: {
    marginTop: 10,
    color: colors.text,
  },
});

export default Loading;
