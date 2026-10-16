import { parsePillarText } from "../../domain/ocr-parse";
import { pillarFromResult, textBySize } from "../ocr-service";

const line = (text: string, height: number) => ({ text, frame: { x: 0, y: 0, width: 100, height } });

test("biggest text first: the level painted on the pillar wins over the small print", () => {
  const r = { lines: [line("EXIT 3", 20), line("Ausgang", 18), line("B2", 240), line("C 14", 120)] };
  expect(textBySize(r).split("\n")[0]).toBe("B2");
  expect(parsePillarText(textBySize(r))).toMatchObject({ level: "B2", zone: "C", spot: "14" });
});

test("lines without a box keep working (go last)", () => {
  expect(textBySize({ lines: [{ text: "x", frame: null }, line("B2", 50)] })).toBe("B2\nx");
});

// Real answers from the Samsung S22+ photographing docs/testing/OCR-test-cards.pdf (14.10).
test("test #1: one sign → B2 / C / 14", () => {
  const r = { lines: [line("B2", 606), line("C14", 172), line("nacnyecKa (KoA + MACTO)", 86), line("EXIT → Ausgang Lifts 1-4", 57), line("2", 36), line("f10", 32)] };
  expect(pillarFromResult(r)).toEqual({ level: "B2", zone: "C", spot: "14" });
});

test("test #2: two signs in the photo → the big (near) one wins, B2 is not read as zone B / spot 2", () => {
  const r = {
    lines: [line("B2", 419), line("LEVEL-2", 166), line("C 14", 163), line("2of 10D", 72), line("EXIT > AUsgang : Lifts 1-4", 46), line("H", 40)],
  };
  expect(pillarFromResult(r)).toEqual({ level: "B2", zone: "C", spot: "14" });
});

test("only a LEVEL sign → its keyword is used", () => {
  const r = { lines: [line("LEVEL -2", 300), line("ZONE A · SPOT 117", 140), line("Pay at the machine", 40)] };
  expect(pillarFromResult(r)).toEqual({ level: "-2", zone: "A", spot: "117" });
});

test("test #4: Cyrillic sign read by the Latin-only model (HMBO / 30HA / MACTO) → -2 / B / 23", () => {
  const r = {
    lines: [line("HMBO -2", 310), line("30HAB•MACTO 23", 149), line("B6 f 10I", 64), line("M3xon→", 42), line("PILL", 32)],
  };
  expect(pillarFromResult(r)).toEqual({ level: "-2", zone: "B", spot: "23" });
});

test("real answers 14.10: P-1 / D 07 and U3 / 42", () => {
  expect(pillarFromResult({ lines: [line("P-1", 628), line("D 07", 273), line("Lifts -> Stairs", 52)] })).toEqual({ level: "P1", zone: "D", spot: "07" });
  expect(pillarFromResult({ lines: [line("U3", 570), line("42", 202), line("AUStahrt>", 39)] })).toMatchObject({ level: "U3", spot: "42" });
});
