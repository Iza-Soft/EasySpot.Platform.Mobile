import { dayBucket, formatClock, formatDayMonth, formatDuration, formatEnd, formatLimit } from "../time";

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

describe("formatLimit (Paid time → Other)", () => {
  it.each([
    [30, "30 min"],
    [240, "4 h"],
    [260, "4 h 20 min"],
    [1440 + 150, "1 d 2 h 30 min"],
    [5 * 1440, "5 d"],
    [1440 + 5, "1 d 5 min"],
  ])("%i min → %s", (m, out) => {
    expect(formatLimit(m)).toBe(out);
  });
});

describe("formatEnd", () => {
  const now = new Date(2026, 9, 15, 13, 18);
  it("today → clock only", () => {
    expect(formatEnd(new Date(2026, 9, 15, 14, 18), now)).toBe("14:18");
  });
  it("another day → day and clock", () => {
    expect(formatEnd(new Date(2026, 9, 16, 15, 48), now)).toBe("16.10, 15:48");
  });
});

describe("formatDuration with days (long paid time)", () => {
  const u = { d: "d", h: "h", min: "min" };
  it.each([
    [42 * 60_000, "42 min"],
    [53 * 3_600_000, "2 d 5 h"],
    [48 * 3_600_000, "2 d"],
    [23 * 3_600_000, "23 h"],
  ])("%i ms → %s", (ms, out) => {
    expect(formatDuration(ms, u)).toBe(out);
  });
});
