import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors } from "../../themes/main";

const AboutScreenComponent = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ℹ️ About EasySpot</Text>

      <Text style={styles.tagline}>Your personal location assistant.</Text>

      <Text style={styles.paragraph}>
        EasySpot helps you save, manage, and share the places that matter most
        to you — simply and privately.
      </Text>

      <Text style={styles.paragraph}>With EasySpot, you can:</Text>

      <Text style={styles.listItem}>
        • Save your car’s parking location so you never forget where you parked
      </Text>
      <Text style={styles.listItem}>
        • Store favorite places like cinemas, malls, restaurants, and more
      </Text>
      <Text style={styles.listItem}>
        • Share locations easily with friends and family through popular
        messaging apps
      </Text>

      <Text style={styles.paragraph}>
        All your data is stored locally on your device, giving you full control
        over your information and ensuring your locations stay private.
      </Text>

      <Text style={styles.paragraph}>
        Whether you’re finding your way back to your car or letting someone know
        where to meet, EasySpot makes everyday outings easier and stress-free.
      </Text>
      <Text style={styles.footer}>
        © {new Date().getFullYear()} EasySpot — Developed by Ilko Adamov
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 10,
  },

  tagline: {
    fontWeight: "700",
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginLeft: 10,
    marginBottom: 4,
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    textAlign: "center",
    color: colors.muted,
  },
});

export default AboutScreenComponent;
