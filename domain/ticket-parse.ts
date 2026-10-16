/**
 * Paper parking tickets → the end of the paid time (decided 15.10: only
 * tickets are scanned; no ticket → the time is set by hand).
 *
 * Real tickets (researched 15.10, mockups K1–K4) print several times — when
 * it was issued / when parking started, when it ends — plus a date and an
 * amount. Examples:
 *   UK  "ISSUED 13:18 15 OCT 26 · AMOUNT PAID £3.20 · EXPIRES 15:45"
 *   DE  "Parkbeginn 13:18 · Betrag 2,00 EUR · Parkende 15:45 · 15.10.26"
 *   BG  "Начало 13:18 · Сума 2,00 € · Краен час на престоя 15:45 · 15.10.2026"
 *   FR  "Fin de stationnement 15h45", IT "Scadenza 15:45", ES "Hora fin 15:45"
 *   Garage entry ticket: "ENTRY / ВХОД 15.10.2026 13:18" + barcode — no end
 *   time at all (you pay at the exit).
 *
 * ML Kit (Android) has no Cyrillic model: Cyrillic letters that look Latin
 * come back as Latin ("КРАЕН" → "KPAEH"). Apple Vision reads real Cyrillic.
 * Keywords are matched after folding both to the same Latin look-alikes.
 * Pure TypeScript, tested.
 */

export interface TicketDate {
  day: number;
  month: number; // 1–12
  year?: number;
}

export type TicketRead =
  | {
      kind: "end";
      hours: number;
      minutes: number;
      date?: TicketDate;
      /** The word it was found next to, for the screen ("EXPIRES", "Parkende", "Краен час"); none = latest time on the ticket. */
      keyword?: string;
    }
  | { kind: "entry"; hours: number; minutes: number; date?: TicketDate };

/** keyword (folded) → how it is shown. */
const END_WORDS: [string, string][] = [
  ["VALID UNTIL", "Valid until"],
  ["VALID TILL", "Valid till"],
  ["VALID TO", "Valid to"],
  ["PAID UNTIL", "Paid until"],
  ["EXPIRES", "Expires"],
  ["EXPIRY", "Expiry"],
  ["EXPIRE", "Expire"],
  ["EXP", "Exp"],
  ["UNTIL", "Until"],
  ["PARKENDE", "Parkende"],
  ["PARKZEIT BIS", "Parkzeit bis"],
  ["GULTIG BIS", "Gültig bis"],
  ["ENDE", "Ende"],
  ["BIS", "bis"],
  ["FIN DE STATIONNEMENT", "Fin de stationnement"],
  ["VALABLE JUSQU", "Valable jusqu'à"],
  ["JUSQU", "Jusqu'à"],
  ["FIN", "Fin"],
  ["SCADENZA", "Scadenza"],
  ["FINE SOSTA", "Fine sosta"],
  ["VALIDO FINO", "Valido fino"],
  ["FINO ALLE", "Fino alle"],
  ["HORA FIN", "Hora fin"],
  ["VALIDO HASTA", "Válido hasta"],
  ["HASTA", "Hasta"],
  ["WAZNY DO", "Ważny do"],
  ["OPLACONO DO", "Opłacono do"],
  ["VALABIL PANA", "Valabil până"],
  ["PANA LA", "Până la"],
  ["GELDIG TOT", "Geldig tot"],
  ["SON GECERLILIK", "Son geçerlilik"],
  ["GECERLILIK", "Geçerlilik"],
  // Bulgarian / Russian, folded (КРАЕН → KPAEH, ВАЛИДЕН → BAЛИДEH)
  ["KPAEH", "Краен час"],
  ["BAЛИД", "Валиден до"],
  ["BAJIИД", "Валиден до"],
  ["ДEЙCTBИTEЛEH ДO", "Действителен до"],
  ["ДEЙCTBYET ДO", "Действует до"],
];

const START_WORDS = [
  "ENTRY",
  "ENTRANCE",
  "ISSUED",
  "ISSUE",
  "PURCHASED",
  "ARRIVAL",
  "TIME IN",
  "START",
  "PARKBEGINN",
  "BEGINN",
  "EINFAHRT",
  "DEBUT",
  "ENTREE",
  "INIZIO",
  "INGRESSO",
  "ENTRATA",
  "INICIO",
  "ENTRADA",
  "GIRIS",
  "POCZATEK",
  "WJAZD",
  "INCEPUT",
  "INTRARE",
  "AANKOMST",
  // Bulgarian, folded / as ML Kit reads it (НАЧАЛО, ВХОД)
  "HAЧAЛO",
  "HA4A",
  "HAYA",
  "BXOД",
  "BXOD",
  "BXOA",
];

/** A line with money on it: "2.00" / "3,20" there is an amount, not a time. */
const MONEY = /€|£|\$|ЛB|(^|[^A-Z])(EUR|BGN|GBP|USD|TL|TRY|RON|LEI|ZL|PLN|CHF|KC|LV|AMOUNT|PAID|PRICE|TOTAL|TARIFF|BETRAG|PREIS|MONTANT|IMPORTO|IMPORTE|KWOTA|TUTAR|BEDRAG|CYMA)(?=$|[^A-Z])/;

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  FEV: 2, MAI: 5, JUI: 7, AOU: 8, OKT: 10, DEZ: 12, GEN: 1, MAG: 5, GIU: 6, LUG: 7, AGO: 8, SET: 9, OTT: 10, DIC: 12, ENE: 1, ABR: 4,
};

// Cyrillic letters that look Latin → Latin (what ML Kit on Android gives back anyway).
const LOOKALIKE: Record<string, string> = { А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H", О: "O", Р: "P", С: "C", Т: "T", У: "Y", Х: "X" };

/** Upper case, no accents (Ü→U, Ç→C, İ→I), Cyrillic look-alikes → Latin. */
export function fold(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/İ/g, "I")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[АВЕКМНОРСТУХ]/g, (c) => LOOKALIKE[c] ?? c)
    .replace(/Ł/g, "L")
    .replace(/[–—]/g, "-");
}

interface Found {
  line: number;
  hours: number;
  minutes: number;
  /** Text before the time on the same line. */
  before: string;
  after: string;
}

// A time: 15:45, 15.45, 15h45, 8,32 (but not part of a date 15.10.26 / 08.10.), optional AM/PM.
const TIME = /(^|[^\d.\/])([01]?\d|2[0-3])\s?([:.hH,])\s?([0-5]\d)(?![\d])(?!\s?[.\/]\s?\d)(?!\.\s?$)(\s?(AM|PM|A\.M\.|P\.M\.))?/g;

function timesIn(line: string, index: number): Found[] {
  const out: Found[] = [];
  const money = MONEY.test(line);
  let from = 0; // the label of a time is the text since the previous time on the line ("IN 09:10 OUT 11:40")
  for (const m of line.matchAll(TIME)) {
    const sep = m[3];
    // On a line with money, "2.00" / "3,20" is an amount; only "13:18" counts as a time there.
    if (money && sep !== ":") continue;
    let hours = +m[2];
    const minutes = +m[4];
    const ampm = m[6];
    if (ampm) {
      if (hours > 12) continue;
      if (ampm.startsWith("P") && hours < 12) hours += 12;
      if (ampm.startsWith("A") && hours === 12) hours = 0;
    }
    const start = (m.index ?? 0) + m[1].length;
    const end = (m.index ?? 0) + m[0].length;
    out.push({ line: index, hours, minutes, before: line.slice(from, start), after: line.slice(end) });
    from = end;
  }
  return out;
}

function hasWord(text: string, word: string): boolean {
  if (/^[A-Z ]+$/.test(word)) {
    return new RegExp(`(^|[^A-Z])${word}(?=$|[^A-Z])`).test(text);
  }
  return text.includes(word);
}

function endWord(text: string): string | undefined {
  // Longest first, so "VALID UNTIL" wins over "UNTIL", "FIN DE STATIONNEMENT" over "FIN".
  const hit = [...END_WORDS].sort((a, b) => b[0].length - a[0].length).find(([w]) => hasWord(text, w));
  return hit?.[1];
}

function isStart(text: string): boolean {
  return START_WORDS.some((w) => hasWord(text, w)) || /(^|[^A-Z])IN(?=$|[^A-Z])/.test(text);
}

/** "15.10.2026", "15.10.26", "15/10/2026", "08.10.", "15 OCT 26" */
function dateIn(text: string): TicketDate | undefined {
  const year = (y?: string) => (y === undefined ? undefined : +y < 100 ? 2000 + +y : +y);
  const num = text.match(/(^|[^\d])([0-3]?\d)([.\/-])([01]?\d)(?:\3(\d{2,4})|\.)(?=$|[^\d:])/);
  if (num) {
    const day = +num[2];
    const month = +num[4];
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) return { day, month, year: year(num[5]) };
  }
  const named = text.match(/(^|[^\d])([0-3]?\d)\s?([A-Z]{3})[A-Z]*\.?(?:\s?(\d{2,4}))?/);
  if (named && MONTHS[named[3]]) return { day: +named[2], month: MONTHS[named[3]], year: year(named[4]) };
  return undefined;
}

/** A label line like "EXPIRES" / "Parkende" above the time: words, no time and no date on it ("KPAEH 4AC" has a 4 from OCR — fine). */
const isLabelOnly = (s: string) => /[A-ZА-Я]{2,}/.test(s) && timesIn(s, 0).length === 0 && !dateIn(s);

/**
 * Reads a ticket. Returns the end of the paid time (kind "end"), or — when
 * the only time on it is an entry / issue time (garage entry ticket) — kind
 * "entry". null when there is no time at all.
 */
export function parseTicket(raw: string): TicketRead | null {
  const lines = raw.split(/\n/).map(fold).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const found = lines.flatMap((l, i) => timesIn(l, i));
  if (found.length === 0) return null;

  type Labeled = Found & { end?: string; start: boolean };
  const labeled: Labeled[] = found.map((f) => {
    let ctx = f.before;
    // "EXPIRES" on its own line, the time on the next one (also with only a date / symbols before it).
    if (!/[A-ZА-Я]{2,}/.test(ctx) && f.line > 0 && isLabelOnly(lines[f.line - 1])) ctx = lines[f.line - 1];
    return { ...f, end: endWord(ctx), start: isStart(ctx) };
  });
  const dateNear = (f: Found) =>
    dateIn(f.after) ??
    dateIn(f.before) ??
    (lines[f.line + 1] ? dateIn(lines[f.line + 1]) : undefined) ??
    (f.line > 0 ? dateIn(lines[f.line - 1]) : undefined);

  const ends = labeled.filter((f) => f.end);
  if (ends.length) {
    const f = ends[0];
    return { kind: "end", hours: f.hours, minutes: f.minutes, date: dateNear(f), keyword: f.end };
  }
  const others = labeled.filter((f) => !f.start);
  if (others.length) {
    // No keyword: the latest time printed (an end comes after the start / issue time).
    const f = others.reduce((a, b) => (b.hours * 60 + b.minutes > a.hours * 60 + a.minutes ? b : a));
    return { kind: "end", hours: f.hours, minutes: f.minutes, date: dateNear(f) };
  }
  const f = labeled[0];
  return { kind: "entry", hours: f.hours, minutes: f.minutes, date: dateNear(f) };
}

/**
 * The end as a moment. With a date on the ticket → that day. Without one →
 * today, or tomorrow when that time has already passed (an evening ticket
 * that runs into the next morning: bought 18:02, "8:32" means tomorrow).
 */
export function ticketEnd(now: Date, t: { hours: number; minutes: number; date?: TicketDate }): Date {
  const d = new Date(now);
  d.setSeconds(0, 0);
  if (t.date) {
    d.setFullYear(t.date.year ?? now.getFullYear(), t.date.month - 1, t.date.day);
    d.setHours(t.hours, t.minutes);
    return d;
  }
  d.setHours(t.hours, t.minutes);
  if (d.getTime() < now.getTime() - 10 * 60_000) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * When the car went in (garage / mall entry ticket). With a date → that day.
 * Without → today; a time later than now means it was yesterday (in at
 * 23:40, the photo after midnight).
 */
export function entryMoment(now: Date, t: { hours: number; minutes: number; date?: TicketDate }): Date {
  const d = new Date(now);
  d.setSeconds(0, 0);
  if (t.date) {
    d.setFullYear(t.date.year ?? now.getFullYear(), t.date.month - 1, t.date.day);
    d.setHours(t.hours, t.minutes);
    return d;
  }
  d.setHours(t.hours, t.minutes);
  if (d.getTime() > now.getTime() + 10 * 60_000) d.setDate(d.getDate() - 1);
  return d;
}
