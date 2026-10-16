import { EasySpotOcr, OcrResult } from "../modules/easyspot-ocr";
import { parsePillarText, PillarFields } from "../domain/ocr-parse";
import { parseTicket, TicketRead } from "../domain/ticket-parse";

/**
 * Photo → text → parking data. The OCR is native and on-device
 * (modules/easyspot-ocr: ML Kit on Android, Apple Vision on iPhone);
 * the parsing is domain/ocr-parse.ts.
 */
export class OcrUnavailableError extends Error {}

export async function recognizeText(uri: string): Promise<OcrResult> {
  if (!EasySpotOcr) throw new OcrUnavailableError("Text recognition module missing (old native build)");
  return EasySpotOcr.recognizeTextAsync(uri);
}

/**
 * The text ordered by size, biggest first: on a pillar the level is painted
 * huge ("B2"), the small print (exits, ads) comes after — the parser's
 * "first match wins" rules then pick the right thing.
 */
export function textBySize(r: Pick<OcrResult, "lines">): string {
  return [...r.lines]
    .sort((a, b) => (b.frame?.height ?? 0) - (a.frame?.height ?? 0))
    .map((l) => l.text)
    .join("\n");
}

/**
 * Pillar: the level comes from the BIGGEST text that is a level on its own
 * (the sign being photographed, close to the camera) — not from a "LEVEL -2"
 * on a smaller sign further away. Zone and spot then from all the text.
 */
export function pillarFromResult(r: Pick<OcrResult, "lines">): PillarFields {
  const sorted = [...r.lines].sort((a, b) => (b.frame?.height ?? 0) - (a.frame?.height ?? 0));
  const biggest = sorted[0]?.frame?.height ?? 0;
  const level = sorted
    .slice(0, 3)
    .filter((l) => (l.frame?.height ?? 0) >= biggest * 0.4)
    .map((l) => parsePillarText(l.text).level)
    .find(Boolean);
  const fields = parsePillarText(sorted.map((l) => l.text).join("\n"), { level });
  // Photo of the spot: the zone is often just a big letter painted on the pillar ("C").
  // A big text that is one letter on its own is the zone ("P" is the parking sign, not a zone).
  if (!fields.zone) {
    const letter = sorted
      .filter((l) => (l.frame?.height ?? 0) >= biggest * 0.4)
      .map((l) => l.text.trim().toUpperCase())
      .find((t) => /^[A-Z]$/.test(t) && t !== "P");
    if (letter) fields.zone = letter;
  }
  return fields;
}

export async function scanPillar(uri: string): Promise<{ fields: PillarFields; result: OcrResult }> {
  const result = await recognizeText(uri);
  return { fields: pillarFromResult(result), result };
}

/** A paper ticket → its end time (or the entry time of a garage ticket). Lines in print order. */
export async function scanTicket(uri: string): Promise<{ ticket: TicketRead | null; result: OcrResult }> {
  const result = await recognizeText(uri);
  return { ticket: parseTicket(ticketText(result)), result };
}

/** The ticket's lines top to bottom (OCR blocks can come in another order). */
export function ticketText(r: Pick<OcrResult, "lines" | "text">): string {
  if (!r.lines.length) return r.text;
  return [...r.lines]
    .sort((a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0))
    .map((l) => l.text)
    .join("\n");
}
