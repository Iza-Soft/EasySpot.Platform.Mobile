import { StyleSheet } from "react-native";
import { colors } from "./main";

export const typography = StyleSheet.create({
  headerLarge: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  header: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.muted,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelAccent: {
    fontSize: 11,
    color: colors.tab,
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "white",
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    marginTop: 1,
  },
  itemText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 10,
  },
  itemSubText: {
    fontSize: 11,
    color: colors.muted,
    marginLeft: 10,
  },
  footer: {
    fontSize: 12,
    textAlign: "center",
    color: colors.muted,
  },
});
