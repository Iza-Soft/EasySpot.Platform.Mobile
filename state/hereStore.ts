import { useSyncExternalStore } from "react";
import { GeoAddress, placeLines } from "../services/geocoding";

/**
 * ONE "where am I" for the whole app.
 * Home measures quickly; the Save sheet measures fresh before saving. Whoever
 * measured last publishes here, so the GPS tile on Home and the accuracy in
 * the Save sheet always show the same number.
 */
export type HereState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; area: string | null; city: string | null; accuracy: number | null; at: number };

let state: HereState = { status: "loading" };
const listeners = new Set<() => void>();

function set(next: HereState) {
  state = next;
  listeners.forEach((l) => l());
}

export function publishHere(fix: { accuracy: number | null }, address: GeoAddress | null) {
  set({ status: "ok", ...placeLines(address), accuracy: fix.accuracy, at: Date.now() });
}

/** An error only replaces "loading": a known place stays on screen. */
export function publishHereError() {
  if (state.status !== "ok") set({ status: "error" });
}

export function getHere(): HereState {
  return state;
}

export function useHereState(): HereState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

/** Test hook. */
export function __resetHereForTests() {
  state = { status: "loading" };
}
