import { isLate, LATE_AFTER_MS, LogEntry } from "../reminder-log";

const e = (delayMs: number): LogEntry => ({ key: "k", title: "", test: false, plannedAt: 1_000_000, cameAt: 1_000_000 + delayMs });

test("up to 1 min after the planned time is on time; more is late", () => {
  expect(isLate(e(0))).toBe(false);
  expect(isLate(e(LATE_AFTER_MS))).toBe(false);
  expect(isLate(e(LATE_AFTER_MS + 1))).toBe(true);
  expect(isLate(e(7 * 60_000))).toBe(true);
});
