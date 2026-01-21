import { StyleSheet, View, Text, Image } from "react-native";

export default function FooterComponent() {
  return (
    <View style={styles.footer}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.footerText}>
          © 2026 EasySpot — Developed by Ilko Adamov
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 60,
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
