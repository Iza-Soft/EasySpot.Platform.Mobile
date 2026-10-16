/**
 * Barometric level detection.
 *
 * Phone barometers have a per-device absolute offset of ~±1–2 hPa (10–15 m),
 * so EasySpot NEVER uses absolute pressure. It compares two readings taken by
 * the same phone:
 *   - P_park   when the user taps PARK (inside the garage), and
 *   - P_street a reading at street level (garage exit, or when the user comes
 *     back and opens Find while standing outside).
 * If the two readings are far apart in time, weather changes the pressure by
 * itself (typically up to ~1 hPa per 3 h), so the street reading is corrected
 * with the change in reported surface pressure for the same place
 * (weather API) between the two moments.
 */

export interface PressureSample {
  /** hPa, as reported by the phone (expo-sensors Barometer / CMAltimeter). */
  hPa: number;
  /** Unix ms. */
  at: number;
}

export interface WeatherPressure {
  /** Surface pressure from a weather service for the parking location, hPa. */
  atPark: number;
  atStreet: number;
}

export interface LevelEstimate {
  /** Metres relative to street level. Negative = below street. */
  deltaMeters: number;
  /** Whole floors relative to street. -2 = two floors down. */
  levels: number;
  /** 0..1 — how close deltaMeters is to a whole number of floors, reduced for long gaps without weather data. */
  confidence: number;
  weatherCorrected: boolean;
}

/** Typical floor-to-floor height of a parking structure. User-adjustable per garage. */
export const DEFAULT_FLOOR_HEIGHT_M = 3.0;

const SEA_LEVEL_HPA = 1013.25;

/** International barometric formula: altitude (m) for a pressure (hPa). */
export function pressureToAltitude(hPa: number, seaLevelHPa = SEA_LEVEL_HPA): number {
  return 44330 * (1 - Math.pow(hPa / seaLevelHPa, 0.190263));
}

export function estimateLevel(
  park: PressureSample,
  street: PressureSample,
  options: { floorHeightM?: number; weather?: WeatherPressure } = {},
): LevelEstimate {
  const floor = options.floorHeightM ?? DEFAULT_FLOOR_HEIGHT_M;

  // Move the street reading back in time to the moment of parking by removing
  // the weather-driven change between the two samples.
  let streetHPaAtParkTime = street.hPa;
  if (options.weather) {
    streetHPaAtParkTime = street.hPa - (options.weather.atStreet - options.weather.atPark);
  }

  const deltaMeters = pressureToAltitude(park.hPa) - pressureToAltitude(streetHPaAtParkTime);
  const exact = deltaMeters / floor;
  const levels = Math.round(exact);

  // 1 when exactly on a floor, 0 when exactly between two floors.
  let confidence = 1 - Math.min(1, Math.abs(exact - levels) * 2);

  // Without weather correction, confidence decays with the time gap.
  const gapHours = Math.abs(street.at - park.at) / 3_600_000;
  if (!options.weather && gapHours > 0.25) {
    confidence *= Math.max(0.2, 1 - gapHours / 4);
  }

  return {
    deltaMeters: round1(deltaMeters),
    levels,
    confidence: round2(confidence),
    weatherCorrected: !!options.weather,
  };
}

export type LevelLabelStyle = "letter" | "signed";

/**
 * Formats a floor offset the way garages sign it.
 *  letter: -2 → "B2", 0 → "G", 3 → "L3"
 *  signed: -2 → "-2", 0 → "0", 3 → "+3"
 */
export function formatLevel(levels: number, style: LevelLabelStyle = "letter"): string {
  if (style === "signed") return levels > 0 ? `+${levels}` : `${levels}`;
  if (levels === 0) return "G";
  return levels < 0 ? `B${-levels}` : `L${levels}`;
}

/**
 * Shows a level the user TYPED in the chosen style, without changing what is stored:
 *  letter: "-2" / "−2" → "B2"      signed: "B2" / "b2" → "−2"
 * Anything else ("P3", "C", "L1", "Roof") is shown as typed.
 */
export function displayLevel(text: string | null | undefined, style: LevelLabelStyle): string {
  const v = (text ?? "").trim();
  if (style === "signed") {
    const m = /^b\s*(\d+)$/i.exec(v);
    return m ? `−${m[1]}` : v;
  }
  const m = /^[-−–]\s*(\d+)$/.exec(v);
  return m ? `B${m[1]}` : v;
}

/** Only suggest a level automatically when it is trustworthy; otherwise ask the user. */
export function shouldAutoSuggest(estimate: LevelEstimate): boolean {
  return estimate.confidence >= 0.5 && Math.abs(estimate.deltaMeters) >= 1.5;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
