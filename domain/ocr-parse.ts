/**
 * Turns raw OCR text into structured parking data.
 * OCR itself is platform code (ML Kit bundled model on Android — works on
 * Huawei without Google services — and Apple Vision on iOS). This file is
 * pure TypeScript so it is identical everywhere and unit-tested.
 */

export interface PillarFields {
  level?: string;
  zone?: string;
  spot?: string;
}

const LEVEL_WORDS = "LEVEL|LVL|FLOOR|DECK|ETAGE|ÉTAGE|EBENE|NIVEAU|KAT|ЕТАЖ|НИВО|УРОВЕНЬ";
const ZONE_WORDS = "ZONE|SECTION|SECTOR|SEKTOR|SECTEUR|BEREICH|BÖLGE|ЗОНА|СЕКТОР";
const SPOT_WORDS = "SPOT|SPACE|PLACE|PLATZ|BAY|NO\\.?|№|МЯСТО|МЕСТО";

export function parsePillarText(raw: string): PillarFields {
  const text = normalise(raw);
  const out: PillarFields = {};

  // 1) Explicit keywords win.
  const kwLevel = text.match(new RegExp(`(?:${LEVEL_WORDS})\\s*[:#]?\\s*(-?\\d{1,2}|[A-Z]-?\\d{1,2})\\b`));
  if (kwLevel) out.level = cleanLevel(kwLevel[1]);
  const kwZone = text.match(new RegExp(`(?:${ZONE_WORDS})\\s*[:#]?\\s*([A-Z]{1,2}|\\d{1,2})\\b`));
  if (kwZone) out.zone = kwZone[1];
  const kwSpot = text.match(new RegExp(`(?:${SPOT_WORDS})\\s*[:#]?\\s*(\\d{1,4})\\b`));
  if (kwSpot) out.spot = kwSpot[1];

  // 2) Garage-style level codes: B2, P-1, U2, -2, L3 (standalone tokens).
  if (!out.level) {
    const code = text.match(/(?:^|\s)([BPUL]-?\d{1,2}|-\d{1,2})(?=\s|$)/);
    if (code) out.level = cleanLevel(code[1]);
  }

  // 3) Zone+spot combos: "C 14", "C14", "C-14" (not the level token itself).
  if (!out.zone || !out.spot) {
    const tokens = text.split(/\s+/).join(" ");
    const combo = tokens.match(/(?:^|\s)([A-Z])\s?-?\s?(\d{1,4})(?=\s|$)/g) ?? [];
    for (const m of combo) {
      const [, letter, num] = m.trim().match(/^([A-Z])\s?-?\s?(\d{1,4})$/) ?? [];
      if (!letter) continue;
      if (out.level && cleanLevel(letter + num) === out.level) continue;
      if (!out.zone) out.zone = letter;
      if (!out.spot) out.spot = num;
      break;
    }
  }

  // 4) A lone number left over is most likely the spot.
  if (!out.spot) {
    const nums = (text.match(/(?:^|\s)(\d{1,4})(?=\s|$)/g) ?? []).map((s) => s.trim());
    const candidate = nums.find((n) => n !== out.level?.replace(/\D/g, ""));
    if (candidate) out.spot = candidate;
  }

  return out;
}

export interface TicketTime {
  hours: number;
  minutes: number;
  /** true when found next to a "valid until"-style keyword, false when guessed (latest time on the ticket). */
  fromKeyword: boolean;
}

const UNTIL_WORDS =
  "VALID UNTIL|VALID TILL|EXPIRES?|EXPIRY|EXP\\.?|UNTIL|GÜLTIG BIS|BIS|VALABLE JUSQU'?À|JUSQU'?À|ВАЛИДЕН ДО|ВАЛИДНО ДО|ДЕЙСТВИТЕЛЕН ДО|ДЕЙСТВУЕТ ДО|ДО|SON GEÇERLİLİK|GEÇERLİLİK";

/** Finds the expiry time printed on a pay-and-display / garage ticket. */
export function parseTicketExpiry(raw: string): TicketTime | null {
  const text = normalise(raw);
  const time = "([01]?\\d|2[0-3])[:.h]([0-5]\\d)";

  const kw = text.match(new RegExp(`(?:${UNTIL_WORDS})\\s*[:\\-]?\\s*(?:\\S+\\s+)?${time}`));
  if (kw) return { hours: +kw[1], minutes: +kw[2], fromKeyword: true };

  const all = [...text.matchAll(new RegExp(time, "g"))].map((m) => ({ hours: +m[1], minutes: +m[2] }));
  if (all.length === 0) return null;
  const latest = all.reduce((a, b) => (b.hours * 60 + b.minutes > a.hours * 60 + a.minutes ? b : a));
  return { ...latest, fromKeyword: false };
}

/**
 * Converts a printed time into an absolute expiry. A time already more than
 * 12 h in the past is taken to mean "tomorrow" (overnight tickets).
 */
export function resolveExpiry(now: Date, t: { hours: number; minutes: number }): Date {
  const d = new Date(now);
  d.setHours(t.hours, t.minutes, 0, 0);
  if (now.getTime() - d.getTime() > 12 * 3_600_000) d.setDate(d.getDate() + 1);
  return d;
}

function normalise(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[|]/g, "I")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLevel(v: string): string {
  return v.replace(/\s/g, "").replace(/^([A-Z])-(\d)/, "$1$2");
}
