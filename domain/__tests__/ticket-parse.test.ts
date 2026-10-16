import { entryMoment, parseTicket, ticketEnd } from "../ticket-parse";

// The four real-ticket mockups (K1–K4), as OCR gives them back: one line per printed line.
const UK = ["PAY & DISPLAY", "CAR PARK 4 · MACHINE 0217", "ISSUED 13:18 15 OCT 26", "AMOUNT PAID £3.20", "EXPIRES", "15:45", "15 OCT 26", "DISPLAY THIS SIDE UP"].join("\n");
const DE = ["PARKSCHEIN", "Zone 2 · Automat 1234", "Parkbeginn 13:18", "Betrag 2,00 EUR", "Parkende", "15:45", "15.10.26", "Gut sichtbar hinter die", "Windschutzscheibe legen"].join("\n");
// Apple Vision (iPhone) reads the Cyrillic…
const BG_IOS = ["СИНЯ ЗОНА", "Паркомат № 045", "Рег. № СА1234НН", "Начало 13:18", "Сума 2,00 €", "Краен час на престоя", "15:45", "15.10.2026"].join("\n");
// …ML Kit (Android) gives Latin look-alikes and garbles the rest.
const BG_ANDROID = ["CNHЯ 3OHA", "Паркомат N 045", "Per. N CA1234HH", "HA4AJIO 13:18", "CYMA 2,00 €", "KPAEH 4AC HA ПPECTOЯ", "15:45", "15.10.2026"].join("\n");
const GARAGE = ["WELCOME · ДОБРЕ ДОШЛИ", "Garage Center · Entry 2", "ENTRY / ВХОД", "15.10.2026 13:18", "Keep your ticket.", "Pay at the machine before exit."].join("\n");

describe("parseTicket — real tickets", () => {
  it.each([
    ["UK pay & display", UK, { kind: "end", hours: 15, minutes: 45, keyword: "Expires", date: { day: 15, month: 10, year: 2026 } }],
    ["German Parkschein", DE, { kind: "end", hours: 15, minutes: 45, keyword: "Parkende", date: { day: 15, month: 10, year: 2026 } }],
    ["Bulgarian паркомат (iPhone)", BG_IOS, { kind: "end", hours: 15, minutes: 45, keyword: "Краен час", date: { day: 15, month: 10, year: 2026 } }],
    ["Bulgarian паркомат (Android, look-alikes)", BG_ANDROID, { kind: "end", hours: 15, minutes: 45, keyword: "Краен час" }],
  ])("%s → 15:45", (_, text, expected) => {
    expect(parseTicket(text)).toMatchObject(expected);
  });

  it("garage entry ticket → only the entry time, no end", () => {
    expect(parseTicket(GARAGE)).toEqual({ kind: "entry", hours: 13, minutes: 18, date: { day: 15, month: 10, year: 2026 } });
  });
});

describe("parseTicket — formats", () => {
  it.each([
    ["Fin de stationnement 15h45", 15, 45],
    ["Valable jusqu'au 15/10/2026 à 15h45", 15, 45],
    ["Scadenza 15:45 15/10/2026", 15, 45],
    ["Hora fin 15.45", 15, 45],
    ["Ważny do 15:45", 15, 45],
    ["Geldig tot 15:45", 15, 45],
    ["Синя зона\nВалиден до 16.05", 16, 5],
    ["Краен час на престоя 8:32", 8, 32],
    ["Краен час на престоя 8,32 ч.", 8, 32],
    ["EXPIRES 3:45 PM", 15, 45],
    ["VALID UNTIL 12:05 AM", 0, 5],
    ["Parkende 15:45:00", 15, 45],
  ])("%s", (text, hours, minutes) => {
    expect(parseTicket(text)).toMatchObject({ kind: "end", hours, minutes });
  });

  it("a date is never read as a time (15.10.26 is not 15:10)", () => {
    expect(parseTicket("15.10.26\nParkende 18:45")).toMatchObject({ hours: 18, minutes: 45, date: { day: 15, month: 10 } });
    expect(parseTicket("Datum 15.10.2026")).toBeNull();
    expect(parseTicket("GÜLTIG BIS 08.10. 18:45")).toMatchObject({ hours: 18, minutes: 45, keyword: "Gültig bis", date: { day: 8, month: 10 } });
  });

  it("an amount is never read as a time (2,00 EUR / £3.20)", () => {
    expect(parseTicket("Betrag 2,00 EUR")).toBeNull();
    expect(parseTicket("AMOUNT PAID £3.20\nVALID UNTIL 16:10")).toMatchObject({ hours: 16, minutes: 10 });
  });

  it("no keyword → the latest time that is not an entry / issue time", () => {
    expect(parseTicket("IN 09:10  OUT 11:40")).toEqual({ kind: "end", hours: 11, minutes: 40, date: undefined });
    expect(parseTicket("13:18\n15:45")).toMatchObject({ hours: 15, minutes: 45 });
  });

  it("Turkish, also without accents (OCR)", () => {
    expect(parseTicket("OTOPARK\nGiriş 10:20\nSon Geçerlilik 12:20")).toMatchObject({ hours: 12, minutes: 20, keyword: "Son geçerlilik" });
    expect(parseTicket("OTOPARK Giris 10:20 Son Gecerlilik 12:20")).toMatchObject({ hours: 12, minutes: 20 });
  });

  it("nothing → null", () => {
    expect(parseTicket("THANK YOU")).toBeNull();
  });
});

describe("ticketEnd", () => {
  it("date on the ticket → that day", () => {
    const d = ticketEnd(new Date(2026, 9, 15, 13, 30), { hours: 15, minutes: 45, date: { day: 15, month: 10, year: 2026 } });
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([15, 15, 45]);
  });
  it("no date, later today → today", () => {
    expect(ticketEnd(new Date(2026, 9, 15, 13, 30), { hours: 15, minutes: 45 }).getDate()).toBe(15);
  });
  it("no date, already passed → tomorrow (bought 18:02, ends 8:32 next morning)", () => {
    const d = ticketEnd(new Date(2026, 9, 15, 18, 2), { hours: 8, minutes: 32 });
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([16, 8, 32]);
  });
  it("no date, just passed (a few minutes) → still today: an expired ticket", () => {
    expect(ticketEnd(new Date(2026, 9, 15, 15, 50), { hours: 15, minutes: 45 }).getDate()).toBe(15);
  });
});

describe("entryMoment (mall / garage entry ticket)", () => {
  it("with the date → that moment; free time counts from it, not from the photo", () => {
    const now = new Date(2026, 9, 15, 13, 40);
    const entry = entryMoment(now, { hours: 13, minutes: 18, date: { day: 15, month: 10, year: 2026 } });
    const end = new Date(entry.getTime() + 2 * 3_600_000);
    expect([end.getHours(), end.getMinutes()]).toEqual([15, 18]);
  });
  it("no date, later than now → yesterday (in 23:40, photo at 00:05)", () => {
    const d = entryMoment(new Date(2026, 9, 16, 0, 5), { hours: 23, minutes: 40 });
    expect([d.getDate(), d.getHours()]).toEqual([15, 23]);
  });
});
