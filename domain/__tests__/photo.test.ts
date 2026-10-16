import { findPlate, plateFromLine } from "../plate";
import { fillField, nameWithPlate } from "../photo-fill";
import { toHsv, zoneColorFromPixels } from "../zone-color";
import { pillarFromResult } from "../../services/ocr-service";

describe("plateFromLine", () => {
  it.each([
    ["SA63 USM", "SA63 USM", "SA63USM"], // UK
    ["CB 1234 AB", "CB 1234 AB", "CB1234AB"], // BG
    ["BG CB 1234 AB", "CB 1234 AB", "CB1234AB"], // BG with the country band
    ["CM1414AX", "CM1414AX", "CM1414AX"],
    ["M AB 1234", "M AB 1234", "MAB1234"], // DE
    ["B-XY 123", "B-XY 123", "BXY123"], // DE with dash
    ["AB-123-CD", "AB-123-CD", "AB123CD"], // FR
    ["1234 BCD", "1234 BCD", "1234BCD"], // ES
    ["B 123 ABC", "B 123 ABC", "B123ABC"], // RO
    ["34 ABC 123", "34 ABC 123", "34ABC123"], // TR
    ["WA 12345", "WA 12345", "WA12345"], // generic (PL)
  ])("%s", (raw, display, compact) => {
    expect(plateFromLine(raw)).toEqual({ display, compact });
  });

  it.each(["B2", "C 14", "LEVEL -2", "P1 D07", "EXIT 3", "14:30", "GOLF", "214", "ZONE C 12345"])("not a plate: %s", (raw) => {
    expect(plateFromLine(raw)).toBeNull();
  });
});

describe("findPlate", () => {
  it("prefers a known plate shape, and tells which line it was", () => {
    const lines = [
      { text: "C", frame: { height: 300 } },
      { text: "GOLF", frame: { height: 30 } },
      { text: "SA63 USM", frame: { height: 40 } },
      { text: "214", frame: { height: 120 } },
    ];
    expect(findPlate(lines)).toEqual({ display: "SA63 USM", compact: "SA63USM", line: 2 });
  });

  it("none in a pillar photo", () => {
    expect(findPlate([{ text: "B2" }, { text: "C 14" }])).toBeNull();
  });
});

describe("photo of the spot → pillar fields", () => {
  it("the BG plate's digits are not taken as the spot once the plate line is left out", () => {
    const lines = [
      { text: "B2", frame: { x: 0, y: 0, width: 100, height: 120 } },
      { text: "C", frame: { x: 0, y: 150, width: 100, height: 200 } },
      { text: "CB 1234 AB", frame: { x: 300, y: 500, width: 200, height: 40 } },
    ];
    const plate = findPlate(lines)!;
    expect(plate.compact).toBe("CB1234AB");
    const fields = pillarFromResult({ lines: lines.filter((_, i) => i !== plate.line) });
    expect(fields).toEqual({ level: "B2", zone: "C" });
  });
});

describe("zone colour from pixels", () => {
  const blue = 0x2f6fd6;
  const white = 0xf2f3f5;
  const grey = 0x8b8d98;
  const red = 0xdd2233;
  const fill = (n: number, c: number) => Array.from({ length: n }, () => c);

  it("hue of the app's blue", () => {
    expect(Math.round(toHsv(blue).h)).toBe(217);
  });

  it("a blue band with white letters → blue", () => {
    expect(zoneColorFromPixels([...fill(300, blue), ...fill(276, white)])).toBe("blue");
  });

  it("concrete and white walls → nothing (picked by hand)", () => {
    expect(zoneColorFromPixels([...fill(300, grey), ...fill(276, white)])).toBeNull();
  });

  it("a small red tail-light does not make the zone red", () => {
    expect(zoneColorFromPixels([...fill(40, red), ...fill(536, grey)])).toBeNull();
  });

  it.each([
    [0xf5c400, "yellow"],
    [0x30a46c, "green"],
    [0xf5803e, "orange"],
    [0x8e4ec6, "purple"],
    [0xe5484d, "red"],
  ])("%s → %s", (c, key) => {
    expect(zoneColorFromPixels(fill(100, c))).toBe(key);
  });
});

describe("fillField (Retake rules)", () => {
  it("empty field → filled from the photo", () => {
    expect(fillField("", undefined, "C")).toEqual({ value: "C", filled: "C" });
  });
  it("a typed value stays", () => {
    expect(fillField("D", undefined, "C")).toEqual({ value: "D", filled: undefined });
  });
  it("Retake replaces what the previous photo filled", () => {
    expect(fillField("C", "C", "E")).toEqual({ value: "E", filled: "E" });
  });
  it("…but not after the user changed it", () => {
    expect(fillField("F", "C", "E")).toEqual({ value: "F", filled: undefined });
  });
  it("nothing recognised → the field stays (and stays the photo's)", () => {
    expect(fillField("C", "C", undefined)).toEqual({ value: "C", filled: "C" });
    expect(fillField("", undefined, undefined)).toEqual({ value: "", filled: undefined });
  });
});

describe("nameWithPlate", () => {
  it.each([
    ["", "SA63USM", undefined, "SA63USM"],
    ["Office garage", "SA63USM", undefined, "Office garage - SA63USM"],
    ["Office garage - SA63USM", "SA63USM", undefined, "Office garage - SA63USM"],
    ["Office garage - SA63USM", "CB1234AB", "SA63USM", "Office garage - CB1234AB"],
    ["SA63USM", "CB1234AB", "SA63USM", "CB1234AB"],
    ["Office garage", undefined, undefined, "Office garage"],
  ])("%j + %s", (name, plate, old, out) => {
    expect(nameWithPlate(name, plate, old)).toBe(out);
  });
});
