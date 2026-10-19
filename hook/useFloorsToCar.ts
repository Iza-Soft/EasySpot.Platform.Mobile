import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { floorsAboveCar, FLOORS_MAX_AGE_MS } from "../domain/floors";
import { readPressure } from "../platform/barometer";
import { Spot } from "../services/spots-service";

/**
 * The newest reading, shared by all screens: Parked opened from Spots shows the
 * floors at once (no wait for its own first reading), and a screen that goes to
 * the background keeps showing what it had instead of blinking away.
 */
let lastReading: { hPa: number; at: number } | null = null;
/** A reading this recent is still "now" (you can't walk a floor in that time with the phone in hand). */
const FRESH_MS = 30_000;
const freshReading = () => (lastReading && Date.now() - lastReading.at <= FRESH_MS ? lastReading.hPa : null);

/**
 * The air pressure now, read again and again while `enabled` and the app is in
 * front (the first reading 1 s, then the median of 1.5 s, every ≈ 3 s).
 * Nothing is measured in the background. When `enabled` turns off, the last
 * value stays (no blink while the next screen opens).
 * null = not known (yet) or no barometer.
 */
export function useLivePressure(enabled: boolean): number | null {
  const [hPa, setHPa] = useState<number | null>(freshReading);
  useEffect(() => {
    if (!enabled) return; // keep showing the last value
    // Back after a while: an old value could be a floor off → only a fresh one.
    setHPa(freshReading());
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let running = false;
    let first = true;
    let active = AppState.currentState === "active";

    const tick = async () => {
      timer = null;
      if (!alive || !active || running) return;
      running = true;
      const now = await readPressure(first ? 1000 : 1500).catch(() => null);
      running = false;
      first = false;
      if (!alive) return;
      if (now != null) lastReading = { hPa: now, at: Date.now() };
      setHPa(now);
      // No barometer (null) → stop; otherwise again in a moment.
      if (now != null) timer = setTimeout(tick, 1500);
    };
    const sub = AppState.addEventListener("change", (s) => {
      const was = active;
      active = s === "active";
      if (active && !was && !timer) {
        setHPa(freshReading());
        tick();
      }
    });
    tick();
    return () => {
      alive = false;
      sub.remove();
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);
  return hPa;
}

/** A parking whose pressure can still be compared (saved, not older than 6 h). */
export function canShowFloors(spot: Spot | null | undefined, now = Date.now()): boolean {
  return !!spot && spot.parkPressureHPa != null && now - new Date(spot.timestamp).getTime() <= FLOORS_MAX_AGE_MS;
}

/**
 * Floors you are above the car, live (3 = the car is 3 floors below you,
 * -4 = 4 above, 0 = same floor); null = don't show the line.
 * With `pressure` given (Spots: one reading for all rows) nothing is measured here.
 */
export function useFloorsToCar(spot: Spot | null | undefined, enabled = true, pressure?: number | null): number | null {
  const own = useLivePressure(enabled && pressure === undefined && canShowFloors(spot));
  const now = pressure === undefined ? own : pressure;
  const last = useRef<number | null>(null);
  const id = spot?.id;
  useEffect(() => {
    last.current = null;
  }, [id]);
  if (!enabled || !spot) return null;
  const f = floorsAboveCar(spot.parkPressureHPa, now, new Date(spot.timestamp).getTime(), Date.now(), last.current);
  last.current = f;
  return f;
}
