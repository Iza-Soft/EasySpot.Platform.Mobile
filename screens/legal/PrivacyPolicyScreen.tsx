import React, { useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../themes/main";
import Checkbox from "expo-checkbox";

export default function PrivacyPolicyScreenComponent({
  required,
  isChecked,
  setIsChecked,
}: any) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🛡️ Privacy Policy</Text>
      <Text style={styles.effectiveDate}>Effective Date: January 2026</Text>

      <Text style={styles.paragraph}>
        EasySpot respects your privacy and is committed to protecting it. This
        Privacy Policy explains how EasySpot collects and uses your information.
      </Text>

      <Text style={styles.heading}>📍 Information We Collect</Text>
      <Text style={styles.paragraph}>
        EasySpot collects only the minimum data necessary for its core
        functionality.
      </Text>

      <Text style={styles.subHeading}>Location Data</Text>
      <Text style={styles.paragraph}>
        EasySpot uses your device’s location to provide its core functionality,
        including saving parking locations and helping you find your parked
        vehicle.
      </Text>
      <Text style={styles.paragraph}>
        The app may access the following types of location data:
      </Text>
      <Text style={styles.listItem}>
        • Approximate location (ACCESS_COARSE_LOCATION) to determine your
        general area
      </Text>
      <Text style={styles.listItem}>
        • Precise location (ACCESS_FINE_LOCATION) to accurately save and
        retrieve parking locations
      </Text>
      <Text style={styles.paragraph}>
        Location data is accessed only while the app is actively in use
        (foreground). EasySpot does not collect or access location data in the
        background.
      </Text>
      <Text style={styles.paragraph}>
        All location data is stored locally on your device and is never
        transmitted, shared, sold, or used for advertising or analytics
        purposes.
      </Text>
      {/* <Text style={styles.listItem}>• Save parking locations</Text>
      <Text style={styles.listItem}>
        • Help you find your parked vehicle later
      </Text>
      <Text style={styles.paragraph}>
        Location data is only collected when you are actively using the app. It
        is stored locally on your device and is never shared with third parties.
      </Text> */}

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
        EasySpot does not transmit personal data to external servers.
      </Text>
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
        EasySpot may request access to your device’s location. You can grant or
        deny this permission and change it at any time in your device settings.
      </Text>

      <Text style={styles.heading}>🔄 Changes to This Policy</Text>
      <Text style={styles.paragraph}>
        We may update this Privacy Policy occasionally. Major changes will
        appear in the app. Please review it periodically.
      </Text>

      <Text style={styles.heading}>📬 Contact Us</Text>
      {required ? (
        <Text style={styles.paragraph}>
          For questions about this Privacy Policy, contact the developer:{" "}
          <Text style={styles.email}>📧 ilko.z.adamov@gmail.com</Text>
        </Text>
      ) : (
        <>
          <Text style={styles.paragraph}>
            For questions about this Privacy Policy, contact the developer:
          </Text>
          <Text style={styles.email}>📧 ilko.z.adamov@gmail.com</Text>
        </>
      )}

      {required && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsChecked(!isChecked)}
        >
          <Text style={styles.emoji}>{isChecked ? "☑️" : "⬜️"}</Text>
          <Text style={styles.checkboxText}>
            I have read and agree to the Privacy Policy
          </Text>
        </TouchableOpacity>
      )}

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
    marginTop: 20,
    fontSize: 12,
    textAlign: "center",
    color: colors.muted,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
    marginBottom: 20,
  },
  acceptButton: {
    backgroundColor: colors.tab,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  checkboxContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
  },
  checkboxButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 16,
  },
});
