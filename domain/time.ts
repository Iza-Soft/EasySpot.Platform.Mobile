/** Small, locale-neutral time formatting used across the 2.0 screens. */

const pad = (n: number) => String(n).padStart(2, "0");

/** 13:05 */
export function formatClock(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 08.10 */
export function formatDayMonth(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`;
}

/** 45 min · 1 h 12 min · 3 h (minutes dropped from 10 h up). Units are passed in so they can be translated. */
export function formatDuration(ms: number, units: { h: string; min: string } = { h: "h", min: "min" }): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} ${units.min}`;
  if (h >= 10 || m === 0) return `${h} ${units.h}`;
  return `${h} ${units.h} ${m} ${units.min}`;
}

export type DayBucket = "today" | "week" | "earlier";

export function dayBucket(d: Date | number, now = new Date()): DayBucket {
  const date = typeof d === "number" ? new Date(d) : d;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (date >= start) return "today";
  const weekAgo = new Date(start);
  weekAgo.setDate(weekAgo.getDate() - 6);
  return date >= weekAgo ? "week" : "earlier";
}
