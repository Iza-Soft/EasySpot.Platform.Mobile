import { useSyncExternalStore } from "react";

/**
 * A change counter for saved spots. Every write in spots-service bumps it, so
 * any screen (Spots list, tab badge, Parked) can reload — no prop drilling,
 * no stale lists after Save / End parking / Delete.
 */
let version = 0;
const listeners = new Set<() => void>();

export function bumpSpots() {
  version += 1;
  listeners.forEach((l) => l());
}

export function useSpotsVersion(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
}
