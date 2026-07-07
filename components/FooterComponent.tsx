import { StyleSheet, View, Text, Image } from "react-native";
import { useTranslation } from "react-i18next";
import AppText from "./AppTextComponent";

export default function FooterComponent() {
  const { t: localize } = useTranslation();

  return (
    <View style={styles.footer}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <AppText style={styles.footerText}>
          {localize("common.footer", { year: new Date().getFullYear() })}
        </AppText>
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
