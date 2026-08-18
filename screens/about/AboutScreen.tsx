import React from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import { colors } from "../../themes/main";
import { useTranslation } from "react-i18next";
import { typography } from "../../themes/typography";
import AppText from "../../components/AppTextComponent";

const AboutScreenComponent = () => {
  const { t: localize } = useTranslation();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText style={styles.title}>{localize("about.title")}</AppText>

      <AppText style={styles.tagline}>{localize("about.tagline")}</AppText>

      <AppText style={styles.paragraph}>
        {localize("about.description")}
      </AppText>

      <AppText style={styles.paragraph}>{localize("about.can_do")}</AppText>

      <AppText style={styles.listItem}>
        {localize("about.features.parking")}
      </AppText>
      <AppText style={styles.listItem}>
        {localize("about.features.favorites")}
      </AppText>
      <AppText style={styles.listItem}>
        {localize("about.features.share")}
      </AppText>

      <AppText style={styles.paragraph}>
        {localize("about.privacy_note")}
      </AppText>

      <AppText style={styles.paragraph}>{localize("about.closing")}</AppText>
      <AppText style={styles.footer}>
        {localize("common.footer", { year: new Date().getFullYear() })}
      </AppText>
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
