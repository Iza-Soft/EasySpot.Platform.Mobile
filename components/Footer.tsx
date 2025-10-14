import { StyleSheet, View, Text, Image } from "react-native";

export default function FooterComponent() {
  return (
    <View style={styles.footer}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={require("../assets/easyspot-logo.png")}
          style={{ width: 20, height: 20, marginRight: 0 }}
          resizeMode="contain"
        />
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} EasySpot. All rights reserved.
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
