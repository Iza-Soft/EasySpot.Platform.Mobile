import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { photoUri } from "../services/spot-photos";
import { radius, spacing } from "../theme/tokens";
import { PhotoViewer } from "./PhotoViewer";
import { Text } from "./Text";

/**
 * The photo of the spot on Parked and in the details (W3, W5, W7): a strip
 * of the photo, tap → full screen. Nothing when the parking has no photo
 * (or the file is gone).
 */
export function SpotPhotoCard({ photo, height = 110 }: { photo: string | null | undefined; height?: number }) {
  const { t } = useTranslation();
  const uri = photoUri(photo);
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  if (!uri || broken) return null;
  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={t("v2.photo.title")}
        accessibilityHint={t("v2.photo.tap_enlarge")}
        onPress={() => setOpen(true)}
        style={[styles.card, { height }]}
      >
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setBroken(true)} />
        <View style={styles.chip}>
          <Ionicons name="camera-outline" size={14} color="#C8F135" />
          <Text variant="smallStrong" style={{ color: "#F2F3F5", fontSize: 12 }}>{t("v2.photo.tap_enlarge")}</Text>
        </View>
      </Pressable>
      <PhotoViewer visible={open} uri={uri} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, overflow: "hidden", backgroundColor: "#1A1C22", marginBottom: spacing.md },
  chip: {
    position: "absolute",
    right: 10,
    bottom: 10,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: "rgba(14,15,19,0.75)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
