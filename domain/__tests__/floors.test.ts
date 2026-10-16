import { FLOORS_MAX_AGE_MS, floorsAboveCar, heightAboveCar } from "../floors";

const T = 1_000_000;
// ~0.12 hPa per metre near the ground → one floor (3 m) ≈ 0.36 hPa.
const up = (hPa: number, metres: number) => hPa * Math.exp(-metres / 8434);

describe("floors to the car (barometer)", () => {
  it("height from the pressure difference", () => {
    expect(heightAboveCar(1013.25, up(1013.25, 9))).toBeCloseTo(9, 5);
  });
  it("car on B2, you on +1 (≈ 9 m higher) → 3 floors below you", () => {
    expect(floorsAboveCar(1013.25, up(1013.25, 9.2), T, T + 3600_000)).toBe(3);
  });
  it("rooftop car, you on the street → negative (car above you)", () => {
    expect(floorsAboveCar(1000, up(1000, -12), T, T + 60_000)).toBe(-4);
  });
  it("less than half a floor → same floor (0, never -0)", () => {
    expect(Object.is(floorsAboveCar(1000, up(1000, -1.2), T, T + 60_000), 0)).toBe(true);
  });
  it("steady near a half floor (no flicker)", () => {
    // 7.4 m = 2.47 floors: on its own 2, after 3 it stays 3; after 2 it stays 2.
    expect(floorsAboveCar(1000, up(1000, 7.4), T, T, null)).toBe(2);
    expect(floorsAboveCar(1000, up(1000, 7.4), T, T, 3)).toBe(3);
    expect(floorsAboveCar(1000, up(1000, 9.3), T, T, 2)).toBe(3);
  });
  it("nothing to show: no barometer, too old, too far, nonsense", () => {
    expect(floorsAboveCar(null, 1000, T, T)).toBeNull();
    expect(floorsAboveCar(1000, null, T, T)).toBeNull();
    expect(floorsAboveCar(1000, 999, T, T + FLOORS_MAX_AGE_MS + 1)).toBeNull();
    expect(floorsAboveCar(1000, up(1000, 60), T, T)).toBeNull();
    expect(floorsAboveCar(5, 1000, T, T)).toBeNull();
  });
});
