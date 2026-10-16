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

/**
 * 45 min · 1 h 12 min · 3 h (minutes dropped from 10 h up) · 2 d 5 h (from a day up,
 * when the day unit is given). Units are passed in so they can be translated.
 */
export function formatDuration(ms: number, units: { d?: string; h: string; min: string } = { h: "h", min: "min" }): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  if (units.d && totalMin >= 1440) {
    const d = Math.floor(totalMin / 1440);
    const hd = Math.floor((totalMin % 1440) / 60);
    return hd ? `${d} ${units.d} ${hd} ${units.h}` : `${d} ${units.d}`;
  }
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

/**
 * Paid time as chosen (mockup O3): only the parts that are not zero —
 * "30 min", "4 h", "4 h 20 min", "1 d 2 h 30 min".
 */
export function formatLimit(minutes: number, units: { d: string; h: string; min: string } = { d: "d", h: "h", min: "min" }): string {
  const total = Math.max(0, Math.round(minutes));
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} ${units.d}`);
  if (h) parts.push(`${h} ${units.h}`);
  if (m || parts.length === 0) parts.push(`${m} ${units.min}`);
  return parts.join(" ");
}

/** End of paid time: "15:48" today, "16.10, 15:48" on another day. */
export function formatEnd(end: Date | number, now = new Date()): string {
  const date = typeof end === "number" ? new Date(end) : end;
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay ? formatClock(date) : `${formatDayMonth(date)}, ${formatClock(date)}`;
}
