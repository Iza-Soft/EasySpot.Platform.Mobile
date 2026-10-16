import { dayBucket, formatClock, formatDayMonth, formatDuration } from "../time";

test("formatClock / formatDayMonth pad", () => {
  const d = new Date(2026, 9, 8, 9, 5);
  expect(formatClock(d)).toBe("09:05");
  expect(formatDayMonth(d)).toBe("08.10");
});

test.each([
  [45 * 60_000, "45 min"],
  [72 * 60_000, "1 h 12 min"],
  [180 * 60_000, "3 h"],
  [11 * 3_600_000 + 5 * 60_000, "11 h"],
  [-5, "0 min"],
])("formatDuration(%i) = %s", (ms, out) => {
  expect(formatDuration(ms)).toBe(out);
});

test("dayBucket", () => {
  const now = new Date(2026, 9, 8, 12, 0);
  expect(dayBucket(new Date(2026, 9, 8, 0, 1), now)).toBe("today");
  expect(dayBucket(new Date(2026, 9, 3, 23, 0), now)).toBe("week");
  expect(dayBucket(new Date(2026, 9, 1, 23, 0), now)).toBe("earlier");
});
