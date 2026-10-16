import { parsePillarText } from "../ocr-parse";

describe("parsePillarText", () => {
  it.each([
    ["B2\nC 14", { level: "B2", zone: "C", spot: "14" }],
    ["LEVEL -2  ZONE D  SPOT 117", { level: "-2", zone: "D", spot: "117" }],
    ["P-1 A07", { level: "P1", zone: "A", spot: "07" }],
    ["Ниво -1 Зона Б2", { level: "-1" }],
    ["U2", { level: "U2" }],
    ["Ebene 3 Platz 42", { level: "3", spot: "42" }],
  ])("%s", (raw, expected) => {
    expect(parsePillarText(raw)).toMatchObject(expected);
  });

  it("returns empty fields for unrelated text", () => {
    expect(parsePillarText("EXIT →")).toEqual({});
  });
});
