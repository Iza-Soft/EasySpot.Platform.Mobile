import { View, Text, StyleSheet } from "react-native";
import { colors } from "../themes/main";

const EmptyComponent = ({ text }: { text: string }) => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.subtitle}>{text}</Text>
    </View>
  );
};

export default EmptyComponent;

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
