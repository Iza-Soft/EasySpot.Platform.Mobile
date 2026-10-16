/**
 * Car number plates in OCR text (photo of the spot → Name).
 * Pure TypeScript, tested. Only the plate is used — never the make/model
 * (decided 15.10: "Office garage - SA63USM", or just "SA63USM").
 *
 * ML Kit (Android) reads Latin letters and digits; Bulgarian plates use only
 * the Cyrillic letters that look Latin (А В Е К М Н О Р С Т У Х), so they are
 * read as Latin — exactly what we want for the Name.
 */

export interface Plate {
  /** As shown on the badge: "SA63 USM", "CB 1234 AB". */
  display: string;
  /** Without spaces / dashes, used in the Name: "SA63USM". */
  compact: string;
}

// Country band letters that OCR may glue to the plate ("BG CB1234AB").
const COUNTRY = /^(?:BG|GB|UK|D|DE|F|I|E|RO|TR|NL|A|CH|PL|CZ|GR|H|B|P|S|N|DK|SK|SLO|HR|SRB|MK|AL|UA|MD|IRL|L|LT|LV|EST|FIN)\s+/;
const BG_LETTERS = "ABEKMHOPCTYX";
// Specific shapes first (most certain), then a generic European one.
const SPECIFIC: RegExp[] = [
  new RegExp(`^[${BG_LETTERS}]{1,2}\\d{4}[${BG_LETTERS}]{2}$`), // BG: CB1234AB, E1234KX
  /^[A-Z]{2}\d{2}[A-Z]{3}$/, // UK: SA63USM
  /^[A-Z]{2}\d{3}[A-Z]{2}$/, // FR / IT: AB123CD
  /^\d{4}[B-DF-HJ-NP-TV-Z]{3}$/, // ES: 1234BCD
  /^[A-Z]{1,2}\d{2,3}[A-Z]{3}$/, // RO: B123ABC, CJ12ABC
  /^\d{2}[A-Z]{1,3}\d{2,4}$/, // TR: 34ABC123
];
// DE keeps its gap: "M AB 1234", "B-XY 123", "HH AB 123E".
const GERMAN = /^[A-ZÄÖÜ]{1,3}[\s-][A-Z]{1,2}\s?\d{1,4}[EH]?$/;
// Words that mean the line is a sign, not a plate.
const SIGN_WORDS = /\b(LEVEL|FLOOR|ZONE|EXIT|ENTRY|SPOT|PARKING|STOP|LIFT|ELEVATOR|STAIRS|ETAGE|EBENE|AUSGANG|SORTIE|HMBO|30HA|MACTO)\b/;
// A garage level code as a whole token ("B2", "P-1") — the line is a pillar sign.
const LEVEL_TOKEN = /(?:^|\s)[BPUL]-?\d{1,2}(?=\s|$)/;

function clean(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[–—]/g, "-")
    .replace(/[^A-Z0-9ÄÖÜ\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Score = 0 | 1 | 2; // 0 = no, 1 = generic, 2 = specific shape

function score(display: string): Score {
  const compact = display.replace(/[\s-]/g, "");
  if (SPECIFIC.some((r) => r.test(compact))) return 2;
  if (GERMAN.test(display)) return 2;
  if (SIGN_WORDS.test(display) || LEVEL_TOKEN.test(display) || display.split(" ").length > 4) return 0;
  // Generic EU: 6–8 letters/digits, at least 2 of each, in at most 4 groups ("WA 12345", "12-ABC-3").
  if (!/^[A-Z0-9]{6,8}$/.test(compact)) return 0;
  const letters = (compact.match(/[A-Z]/g) ?? []).length;
  const digits = (compact.match(/\d/g) ?? []).length;
  const groups = compact.match(/[A-Z]+|\d+/g) ?? [];
  return letters >= 2 && digits >= 2 && groups.length <= 4 ? 1 : 0;
}

/** The plate in one OCR line, or null. */
export function plateFromLine(raw: string): Plate | null {
  let display = clean(raw);
  if (!display) return null;
  let best = score(display);
  // "BG CB 1234 AB" → try without the country band too.
  const m = display.match(COUNTRY);
  if (m) {
    const rest = display.slice(m[0].length);
    const s = score(rest);
    if (s > best || (s === best && s > 0)) {
      display = rest;
      best = s;
    }
  }
  if (!best) return null;
  return { display, compact: display.replace(/[\s-]/g, "") };
}

/**
 * The most likely plate among the photo's text lines: a known plate shape
 * beats the generic one; then the taller text (closer to the camera).
 * Returns the line index too, so that line is left out of the pillar parsing
 * (a BG plate's "1234" is not a spot number).
 */
export function findPlate(lines: { text: string; frame?: { height: number } | null }[]): (Plate & { line: number }) | null {
  let best: (Plate & { line: number; s: number; h: number }) | null = null;
  for (let i = 0; i < lines.length; i++) {
    const p = plateFromLine(lines[i].text);
    if (!p) continue;
    const s = SPECIFIC.some((r) => r.test(p.compact)) || GERMAN.test(p.display) ? 2 : 1;
    const h = lines[i].frame?.height ?? 0;
    if (!best || s > best.s || (s === best.s && h > best.h)) best = { ...p, line: i, s, h };
  }
  return best ? { display: best.display, compact: best.compact, line: best.line } : null;
}
