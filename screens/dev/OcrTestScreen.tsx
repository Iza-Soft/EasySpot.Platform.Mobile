import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { EasySpotOcr } from "../../modules/easyspot-ocr";
import { scanPillar, ticketText } from "../../services/ocr-service";
import { parseTicket, ticketEnd } from "../../domain/ticket-parse";
import { findPlate } from "../../domain/plate";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/tokens";
import { Button, Text } from "../../ui";

/**
 * DEV BUILDS ONLY (Home → long-press the logo → "Text recognition test").
 * Photograph a pillar or a parking ticket and see what the on-device OCR reads
 * and how domain/ocr-parse.ts understands it. Not translated, never in release.
 */
let shots = 0;

export default function OcrTestScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);

  const shoot = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error("No photo");
      const t0 = Date.now();
      const { fields, result } = await scanPillar(photo.uri);
      const ms = Date.now() - t0;
      const ticket = parseTicket(ticketText(result));
      const plate = findPlate(result.lines);
      const until = ticket ? ticketEnd(new Date(), ticket) : null;
      const report = [
          `${EasySpotOcr?.engine() ?? "?"} · ${ms} ms · ${result.width}×${result.height}`,
          "",
          `PILLAR → level: ${fields.level ?? "—"} · zone: ${fields.zone ?? "—"} · spot: ${fields.spot ?? "—"}`,
          `PLATE → ${plate ? `${plate.display} (Name: ${plate.compact})` : "—"}`,
          `TICKET → ${ticket ? `${ticket.kind === "entry" ? "ENTRY (no end)" : "END"} ${String(ticket.hours).padStart(2, "0")}:${String(ticket.minutes).padStart(2, "0")}${ticket.kind === "end" ? ` (${ticket.keyword ?? "latest time"})` : ""} → ${until?.toLocaleString()}` : "no time found"}`,
          "",
          "LINES (biggest first):",
          ...[...result.lines]
            .sort((a, b) => (b.frame?.height ?? 0) - (a.frame?.height ?? 0))
            .map((l) => `  [h ${l.frame?.height ?? "?"}] ${l.text}`),
        ].join("\n");
      setOut(report);
      // Same report in the terminal where Metro runs (npx expo start / run:android) — easy to copy.
      console.log(`📷 OCR test #${++shots}\n${report}\n────────────────────────────`);
    } catch (e) {
      const msg = `Error: ${e instanceof Error ? e.message : String(e)}`;
      console.warn(`📷 OCR test — ${msg}`);
      setOut(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!permission) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;
  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: colors.background }]}>
        <Text variant="body">Camera permission is needed for the OCR test.</Text>
        <Button label="Allow camera" onPress={requestPermission} style={{ marginTop: spacing.lg }} />
        <Button label="Back" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: "#000" }]}>
      {out ? (
        <ScrollView style={styles.fill} contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}>
          <Text variant="small" style={{ color: "#F2F3F5", fontFamily: "monospace" }} selectable>
            {out}
          </Text>
          <Button label="Scan again" onPress={() => setOut(null)} style={{ marginTop: spacing.lg }} />
          <Button label="Close" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} />
        </ScrollView>
      ) : (
        <>
          <CameraView ref={camera} style={styles.fill} facing="back" />
          <View style={styles.bar}>
            <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.side}>
              <Text variant="bodyStrong" style={{ color: "#fff" }}>Close</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              onPress={shoot}
              style={[styles.shutter, { borderColor: colors.accent }]}
            >
              {busy ? <ActivityIndicator color={colors.accent} /> : <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
            </Pressable>
            <View style={styles.side} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", padding: spacing.xl },
  bar: { position: "absolute", left: 0, right: 0, bottom: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  side: { width: 80, alignItems: "center" },
  shutter: { width: 76, height: 76, borderRadius: radius.pill, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  dot: { width: 56, height: 56, borderRadius: radius.pill },
});
