import React from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import { colors } from "../../themes/main";
import { useTranslation } from "react-i18next";
import { typography } from "../../themes/typography";

const AboutScreenComponent = () => {
  const { t: localize } = useTranslation();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{localize("about.title")}</Text>

      <Text style={styles.tagline}>{localize("about.tagline")}</Text>

      <Text style={styles.paragraph}>{localize("about.description")}</Text>

      <Text style={styles.paragraph}>{localize("about.can_do")}</Text>

      <Text style={styles.listItem}>{localize("about.features.parking")}</Text>
      <Text style={styles.listItem}>
        {localize("about.features.favorites")}
      </Text>
      <Text style={styles.listItem}>{localize("about.features.share")}</Text>

      <Text style={styles.paragraph}>{localize("about.privacy_note")}</Text>

      <Text style={styles.paragraph}>{localize("about.closing")}</Text>
      <Text style={styles.footer}>
        {localize("common.footer", { year: new Date().getFullYear() })}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: typography.headerLarge,
  tagline: {
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 20,
  },
  paragraph: typography.body,
  listItem: { ...typography.body, marginLeft: 10 },
  footer: { ...typography.footer, marginTop: 20 },
});

export default AboutScreenComponent;
