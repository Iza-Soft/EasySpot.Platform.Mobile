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

// Android's OCR (ML Kit) has no Cyrillic model: it reads Cyrillic signs as the Latin letters they
// look like — НИВО → "HMBO"/"HNBO", ЕТАЖ → "ETAX", ЗОНА → "30HA"/"3OHA", МЯСТО → "MACTO"/"MRCTO".
const LEVEL_WORDS = "LEVEL|LVL|FLOOR|DECK|ETAGE|ÉTAGE|EBENE|NIVEAU|KAT|ЕТАЖ|НИВО|УРОВЕНЬ|HMBO|HNBO|HIBO|ETAX|ETAЖ";
const ZONE_WORDS = "ZONE|SECTION|SECTOR|SEKTOR|SECTEUR|BEREICH|BÖLGE|ЗОНА|СЕКТОР|30HA|3OHA|ZOHA|CEKTOP";
const SPOT_WORDS = "SPOT|SPACE|PLACE|PLATZ|BAY|NO\\.?|№|МЯСТО|МЕСТО|MACTO|MRCTO|MЯCTO|MECTO";

/**
 * opts.level: the level already decided from the BIGGEST text in the photo
 * (services/ocr-service.ts) — the sign being photographed. It beats a
 * "LEVEL -2" keyword on a smaller sign further away.
 */
export function parsePillarText(raw: string, opts: { level?: string } = {}): PillarFields {
  const text = normalise(raw);
  const out: PillarFields = opts.level ? { level: opts.level } : {};

  // 1) Explicit keywords win (unless the level is already known).
  const kwLevel = out.level ? null : text.match(new RegExp(`(?:${LEVEL_WORDS})\\s*[:#]?\\s*(-?\\d{1,2}|[A-Z]-?\\d{1,2})\\b`));
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
      // Another level code ("B2" from a second sign in the photo) is not zone B / spot 2.
      if (out.level && /^[BPUL]-?\d{1,2}$/.test(m.trim())) continue;
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
