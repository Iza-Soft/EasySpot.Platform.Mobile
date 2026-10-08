import { ScrollView, Text, StyleSheet } from "react-native";
import { colors } from "../../themes/main";
import AppText from "../../components/AppTextComponent";

export default function TermsOfServiceScreenComponent() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText style={styles.title}>📄 Terms of Service</AppText>
      <AppText style={styles.effectiveDate}>
        Effective Date: January 2026
      </AppText>

      <AppText style={styles.paragraph}>
        Welcome to EasySpot. By downloading, accessing, or using the EasySpot
        mobile application (“App”), you agree to be bound by these Terms of
        Service (“Terms”). If you do not agree to these Terms, please do not use
        the App.
      </AppText>

      {/* Use of the App */}
      <AppText style={styles.heading}>📍 Use of the App</AppText>

      <AppText style={styles.paragraph}>
        EasySpot allows users to manually save, organize, and manage locations
        they choose, including:
      </AppText>

      <AppText style={styles.listItem}>• Parking spots</AppText>
      <AppText style={styles.listItem}>
        • Favorite places such as cinemas, malls, restaurants, and similar
        locations
      </AppText>

      <AppText style={styles.paragraph}>
        EasySpot does not suggest, assign, or verify locations. All saved
        locations are selected and entered entirely by the user.
      </AppText>

      <AppText style={styles.paragraph}>
        All data saved within EasySpot remains on your device and is owned and
        controlled by you.
      </AppText>

      <AppText style={styles.paragraph}>
        Location data displayed or saved by EasySpot is based on device-provided
        location services and user input and may be inaccurate or unavailable.
        EasySpot does not guarantee location accuracy.
      </AppText>

      <AppText style={styles.paragraph}>
        You agree to use the App lawfully, responsibly, and in accordance with
        all applicable laws.
      </AppText>

      {/* No Guarantees */}
      <AppText style={styles.heading}>⚠️ No Guarantees</AppText>

      <AppText style={styles.paragraph}>
        EasySpot is a personal location-saving tool only and does not verify,
        monitor, or evaluate saved locations.
      </AppText>

      <AppText style={styles.paragraph}>
        EasySpot makes no guarantees regarding:
      </AppText>

      <AppText style={styles.listItem}>
        • Accuracy of user-saved location data
      </AppText>
      <AppText style={styles.listItem}>
        • Legality, availability, or accessibility of any saved location
      </AppText>
      <AppText style={styles.listItem}>
        • Whether a saved parking location complies with local laws
      </AppText>
      <AppText style={styles.listItem}>
        • Whether a saved place remains open, valid, or unchanged
      </AppText>

      <AppText style={styles.paragraph}>
        You are solely responsible for choosing locations to save, verifying
        their suitability, and complying with all applicable laws, rules, and
        regulations.
      </AppText>

      {/* Premium */}
      <AppText style={styles.heading}>
        💎 Premium Features & Subscriptions
      </AppText>

      <AppText style={styles.paragraph}>
        EasySpot may offer optional premium features, including paid
        subscriptions.
      </AppText>

      <AppText style={styles.paragraph}>
        Details such as pricing, features, billing, renewal, and cancellation
        will be clearly presented at the time of purchase. Availability and
        features may change at any time.
      </AppText>

      {/* Liability */}
      <AppText style={styles.heading}>🛑 Limitation of Liability</AppText>

      <AppText style={styles.paragraph}>
        EasySpot is provided on an “as is” and “as available” basis.
      </AppText>

      <AppText style={styles.paragraph}>
        To the fullest extent permitted by law, EasySpot and its developer are
        not liable for:
      </AppText>

      <AppText style={styles.listItem}>
        • Parking fines, tickets, towing, or penalties
      </AppText>
      <AppText style={styles.listItem}>
        • Issues caused by inaccurate or outdated user-entered data
      </AppText>
      <AppText style={styles.listItem}>
        • Loss, damage, or theft of vehicles or personal property
      </AppText>
      <AppText style={styles.listItem}>
        • Inability to locate a saved place
      </AppText>
      <AppText style={styles.listItem}>
        • Data loss due to device failure, deletion, or app malfunction
      </AppText>

      <AppText style={styles.paragraph}>
        All risks related to saved locations remain entirely with the user.
      </AppText>

      {/* Termination */}
      <AppText style={styles.heading}>🚫 Termination</AppText>

      <AppText style={styles.paragraph}>
        Access to EasySpot may be suspended or terminated at any time if these
        Terms are violated, the App is misused, or continued use poses legal or
        technical issues.
      </AppText>

      {/* Changes */}
      <AppText style={styles.heading}>🔄 Changes to These Terms</AppText>

      <AppText style={styles.paragraph}>
        These Terms may be updated from time to time. Continued use of EasySpot
        after changes are published constitutes acceptance of the updated Terms.
      </AppText>

      {/* Contact */}
      <AppText style={styles.heading}>📬 Contact</AppText>

      <AppText style={styles.paragraph}>
        For questions or support, contact the developer at:
      </AppText>

      <AppText style={styles.email}>📧 ilko.z.adamov@gmail.com</AppText>

      <AppText style={styles.footer}>
        © {new Date().getFullYear()} EasySpot — Developed by Ilko Adamov
      </AppText>
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
