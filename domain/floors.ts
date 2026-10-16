/**
 * "The car is 2 floors below you" (mockups B1–B4): the air pressure saved at
 * PARK compared with the pressure now. Both are measured with the app open,
 * so nothing runs in the background. Only the DIFFERENCE is used — phone
 * barometers are precise for differences, not for absolute height.
 */

/** A garage floor, floor to floor (multi-storey and underground garages: ~2.8–3.5 m). */
export const FLOOR_HEIGHT_M = 3;
/** After this the weather may have moved the pressure by a floor or more → show nothing. */
export const FLOORS_MAX_AGE_MS = 6 * 60 * 60 * 1000;
/** More than this is not "the garage" any more (another place / another town). */
export const MAX_FLOORS = 10;
/** R·T/g at ~15 °C: metres of height per unit of ln(pressure) near the ground. */
const SCALE_HEIGHT_M = 8434;

/** Metres you are ABOVE the car (negative: below it). */
export function heightAboveCar(parkHPa: number, nowHPa: number): number {
  return SCALE_HEIGHT_M * Math.log(parkHPa / nowHPa);
}

const plausible = (hPa: number | null | undefined): hPa is number => typeof hPa === "number" && hPa > 700 && hPa < 1100;

/**
 * Floors you are above the car: 3 = the car is 3 floors below you, -4 = 4 above
 * you, 0 = same floor. null = nothing to show (no barometer, too long ago, too far).
 * `previous` keeps the number steady near a half floor (no 2 ↔ 3 flicker).
 */
export function floorsAboveCar(
  parkHPa: number | null | undefined,
  nowHPa: number | null | undefined,
  parkedAt: number,
  now: number,
  previous?: number | null,
): number | null {
  if (!plausible(parkHPa) || !plausible(nowHPa)) return null;
  if (now - parkedAt > FLOORS_MAX_AGE_MS || now < parkedAt) return null;
  const raw = heightAboveCar(parkHPa, nowHPa) / FLOOR_HEIGHT_M;
  const floors = previous != null && Math.abs(raw - previous) < 0.7 ? previous : Math.round(raw);
  if (Math.abs(floors) > MAX_FLOORS) return null;
  return floors === 0 ? 0 : floors; // no -0
}
