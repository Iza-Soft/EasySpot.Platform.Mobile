import { parsePillarText, parseTicketExpiry, resolveExpiry } from "../ocr-parse";

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

describe("parseTicketExpiry", () => {
  it("prefers the time after a 'valid until' keyword", () => {
    const t = parseTicketExpiry("PAY & DISPLAY\nENTRY 13:18\nVALID UNTIL\n14:30\n08 OCT 2026");
    expect(t).toEqual({ hours: 14, minutes: 30, fromKeyword: true });
  });

  it("handles a date between keyword and time", () => {
    expect(parseTicketExpiry("GÜLTIG BIS 08.10. 18:45")).toMatchObject({ hours: 18, minutes: 45, fromKeyword: true });
  });

  it("understands Bulgarian", () => {
    expect(parseTicketExpiry("Синя зона\nВалиден до 16.05")).toMatchObject({ hours: 16, minutes: 5, fromKeyword: true });
  });

  it("falls back to the latest time printed", () => {
    expect(parseTicketExpiry("IN 09:10  OUT 11:40")).toEqual({ hours: 11, minutes: 40, fromKeyword: false });
  });

  it("returns null when there is no time", () => {
    expect(parseTicketExpiry("THANK YOU")).toBeNull();
  });
});

describe("resolveExpiry", () => {
  it("keeps today for a time later today", () => {
    const now = new Date(2026, 9, 8, 13, 30);
    expect(resolveExpiry(now, { hours: 14, minutes: 30 }).getDate()).toBe(8);
  });
  it("rolls to tomorrow for an overnight ticket", () => {
    const now = new Date(2026, 9, 8, 22, 0);
    const d = resolveExpiry(now, { hours: 8, minutes: 0 });
    expect(d.getDate()).toBe(9);
  });
});
