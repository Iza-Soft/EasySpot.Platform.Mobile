import { StyleSheet, View, Text } from "react-native";

export default function FooterComponent() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        🅿️ © {new Date().getFullYear()} ParkMate. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 50,
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  footerText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  footerTextSmall: {
    fontSize: 10,
    color: "#777",
    marginTop: 2,
  },
});
