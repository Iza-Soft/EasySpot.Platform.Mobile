import React from "react";
import { Alert } from "react-native";
import { EasySpotLocation } from "../../modules/easyspot-location";
import { areaLine, reverseGeocode, streetLine } from "../../services/geocoding";
import { ActionSheet, SheetAction } from "../../ui";

/**
 * DEV BUILDS ONLY (long-press the logo on Home).
 * Asks THIS phone's geocoder about fixed points abroad, so the address format
 * can be checked for other countries without travelling. Not translated:
 * it never appears in a release build.
 */
const POINTS: { key: string; label: string; lat: number; lng: number }[] = [
  { key: "ist", label: "İstanbul · Şişli (Abide-i Hürriyet Cd.)", lat: 41.0602, lng: 28.9877 },
  { key: "ist2", label: "İstanbul · Kadıköy (Bahariye Cd.)", lat: 40.9887, lng: 29.0275 },
  { key: "par", label: "Paris · Champs-Élysées", lat: 48.8719, lng: 2.3003 },
  { key: "muc", label: "München · Leopoldstraße", lat: 48.16, lng: 11.586 },
  { key: "lon", label: "London · Downing Street", lat: 51.5034, lng: -0.1276 },
  { key: "nyc", label: "New York · 5th Avenue", lat: 40.7484, lng: -73.9857 },
  { key: "sof", label: "София · бул. Витоша", lat: 42.693, lng: 23.319 },
];

export function DebugAddressSheet({ visible, onClose, onOcrTest }: { visible: boolean; onClose: () => void; onOcrTest?: () => void }) {
  const run = async (p: (typeof POINTS)[number]) => {
    onClose();
    const a = await reverseGeocode(p.lat, p.lng);
    const street = streetLine(a);
    const area = areaLine(a, a?.street);
    console.log(`ℹ️ Address test ${p.label}:`, JSON.stringify(a));
    Alert.alert(p.label, a ? `${street ?? "(no street)"}\n${area ?? "(no area)"}\n\ncountry: ${a.countryCode ?? "?"}` : "The phone's geocoder returned nothing.");
  };
  const info = EasySpotLocation?.getServicesInfo();
  const servicesLine = !info
    ? "No native module"
    : info.gmsUsable === undefined
      ? `OLD native build — rebuild the app · GMS package: ${info.gms} · HMS: ${info.hms}`
      : `GMS package: ${info.gms ? info.gmsLabel ?? "yes" : "none"} · usable: ${info.gmsUsable} · HMS: ${info.hms}`;
  const actions: SheetAction[] = [
    ...(onOcrTest
      ? [{ key: "ocr", label: "Text recognition test (camera)", icon: "scan-outline", onPress: () => (onClose(), onOcrTest()) } as SheetAction]
      : []),
    ...POINTS.map((p) => ({ key: p.key, label: p.label, icon: "globe-outline", onPress: () => run(p) }) as SheetAction),
  ];
  return <ActionSheet visible={visible} title="Debug (dev only)" subtitle={servicesLine} actions={actions} onClose={onClose} />;
}
