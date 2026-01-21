import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { colors } from "../../themes/main";

export default function PrivacyPolicyScreenComponent() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🛡️ Privacy Policy</Text>
      <Text style={styles.effectiveDate}>Effective Date: January 2026</Text>

      <Text style={styles.paragraph}>
        EasySpot respects your privacy and is committed to protecting it. This
        Privacy Policy explains how EasySpot collects and uses your information.
      </Text>

      <Text style={styles.heading}>📍 Information We Collect</Text>

      <Text style={styles.subHeading}>Location Data</Text>
      <Text style={styles.paragraph}>
        EasySpot uses your device’s location to:
      </Text>
      <Text style={styles.listItem}>• Save parking locations</Text>
      <Text style={styles.listItem}>
        • Help you find your parked vehicle later
      </Text>
      <Text style={styles.paragraph}>
        Location data is only collected when you are actively using the app. It
        is stored locally on your device and is never shared with third parties.
      </Text>

      <Text style={styles.subHeading}>Local Storage</Text>
      <Text style={styles.paragraph}>
        EasySpot stores data locally on your device, including:
      </Text>
      <Text style={styles.listItem}>• Saved parking locations</Text>
      <Text style={styles.listItem}>• Favorite locations</Text>
      <Text style={styles.paragraph}>
        This data persists until you delete it or uninstall the app.
      </Text>

      <Text style={styles.heading}>🛠️ How We Use Your Information</Text>
      <Text style={styles.paragraph}>We use your information only to:</Text>
      <Text style={styles.listItem}>• Provide core app functionality</Text>
      <Text style={styles.listItem}>• Improve your experience</Text>
      <Text style={styles.paragraph}>
        We never use your information for advertising, marketing, or analytics
        purposes.
      </Text>

      <Text style={styles.heading}>🔁 Data Sharing</Text>
      <Text style={styles.paragraph}>
        EasySpot does not share, sell, or rent your data to third parties. Your
        information stays on your device.
      </Text>

      <Text style={styles.heading}>🔐 Data Security</Text>
      <Text style={styles.paragraph}>
        All data is stored locally on your device. While we take steps to
        protect it, you are responsible for securing access to your device.
      </Text>

      <Text style={styles.heading}>🧹 Your Rights</Text>
      <Text style={styles.paragraph}>You can:</Text>
      <Text style={styles.listItem}>
        • Delete saved parking and favorite locations at any time
      </Text>
      <Text style={styles.listItem}>
        • Clear app data using in-app controls or your device settings
      </Text>

      <Text style={styles.heading}>⚙️ Device Permissions</Text>
      <Text style={styles.paragraph}>
        EasySpot may request access to your device’s location. You can manage
        these permissions in your device settings at any time.
      </Text>

      <Text style={styles.heading}>🔄 Changes to This Policy</Text>
      <Text style={styles.paragraph}>
        We may update this Privacy Policy occasionally. Major changes will
        appear in the app. Please review it periodically.
      </Text>

      <Text style={styles.heading}>📬 Contact Us</Text>
      <Text style={styles.paragraph}>
        For questions about this Privacy Policy, contact the developer:
      </Text>
      <Text style={styles.email}>📧 ilko.z.adamov@gmail.com</Text>

      <Text style={styles.footer}>
        © {new Date().getFullYear()} EasySpot — Developed by Ilko Adamov
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 5,
  },
  effectiveDate: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 15,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 5,
    color: colors.text,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: colors.text,
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
  email: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
});
