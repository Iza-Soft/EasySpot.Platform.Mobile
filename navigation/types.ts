import type { NavigatorScreenParams } from "@react-navigation/native";
import type { SpotKind } from "../services/spots-service";

export type TabParamList = {
  Park: undefined;
  Spots: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  /**
   * No id = a NEW spot: the sheet finds the location and nothing is saved
   * until the user taps Save (closing the sheet discards it).
   * With id = edit an existing spot.
   */
  SaveSpot: { kind: SpotKind; id?: number };
  /** An active parking (opened from Spots). */
  Parked: { id: number };
  /** A finished parking or a favourite place (opened from Spots). */
  SpotDetails: { id: number };
  /** Info screens from Settings (themed, mockups U1–U5). */
  Privacy: undefined;
  Terms: undefined;
  About: undefined;
  Language: undefined;
  /** Phone settings for on-time reminders (mockups W2/W3) — opened from the Home banner or Settings. */
  Reminders: undefined;
  /** DEV builds only: camera → on-device OCR → what the parser understands. */
  OcrTest: undefined;
};
