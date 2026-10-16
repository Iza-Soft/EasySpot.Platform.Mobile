import {
  displayLevel, estimateLevel, formatLevel, pressureToAltitude, shouldAutoSuggest } from "../level";

// ~0.12 hPa per metre near sea level → 6 m ≈ 0.72 hPa.
const HPA_PER_M = 0.1205;

describe("pressureToAltitude", () => {
  it("is 0 m at standard sea-level pressure", () => {
    expect(pressureToAltitude(1013.25)).toBeCloseTo(0, 5);
  });
  it("rises as pressure falls", () => {
    expect(pressureToAltitude(1000)).toBeGreaterThan(pressureToAltitude(1010));
  });
});

describe("estimateLevel", () => {
  const t0 = Date.UTC(2026, 9, 8, 10, 0);

  it("detects two floors below street from a quick walk-out", () => {
    const street = { hPa: 950.0, at: t0 + 3 * 60_000 };
    const park = { hPa: 950.0 + 6 * HPA_PER_M * (950 / 1013.25), at: t0 };
    const e = estimateLevel(park, street);
    expect(e.levels).toBe(-2);
    expect(formatLevel(e.levels)).toBe("B2");
    expect(e.confidence).toBeGreaterThan(0.6);
    expect(shouldAutoSuggest(e)).toBe(true);
  });

  it("removes a weather change between parking and coming back", () => {
    // Real height: 3 m below street (−1). Weather dropped 1.5 hPa in 4 h.
    const parkHPa = 1000 + 3 * HPA_PER_M;
    const park = { hPa: parkHPa, at: t0 };
    const street = { hPa: 1000 - 1.5, at: t0 + 4 * 3_600_000 };
    const uncorrected = estimateLevel(park, street);
    const corrected = estimateLevel(park, street, { weather: { atPark: 1012.0, atStreet: 1010.5 } });
    expect(uncorrected.levels).not.toBe(-1);
    expect(corrected.levels).toBe(-1);
    expect(corrected.weatherCorrected).toBe(true);
  });

  it("has low confidence half-way between floors", () => {
    const street = { hPa: 1000, at: t0 };
    const park = { hPa: 1000 + 4.5 * HPA_PER_M, at: t0 + 60_000 };
    const e = estimateLevel(park, street);
    expect(e.confidence).toBeLessThan(0.3);
    expect(shouldAutoSuggest(e)).toBe(false);
  });
});

describe("formatLevel", () => {
  it.each([
    [-2, "letter", "B2"],
    [0, "letter", "G"],
    [3, "letter", "L3"],
    [-1, "signed", "-1"],
    [2, "signed", "+2"],
  ] as const)("%i %s → %s", (n, style, expected) => {
    expect(formatLevel(n, style)).toBe(expected);
  });
});

test("displayLevel shows typed levels in the chosen style", () => {
  expect(displayLevel("B2", "signed")).toBe("−2");
  expect(displayLevel("b3", "signed")).toBe("−3");
  expect(displayLevel("-2", "letter")).toBe("B2");
  expect(displayLevel("−1", "letter")).toBe("B1");
  expect(displayLevel("B2", "letter")).toBe("B2");
  expect(displayLevel("P3", "signed")).toBe("P3");
  expect(displayLevel("Roof", "letter")).toBe("Roof");
  expect(displayLevel(null, "letter")).toBe("");
});
