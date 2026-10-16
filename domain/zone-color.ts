/**
 * Zone colours (the colour garages paint on pillars / around the bays).
 * The field has 8 colours; from a photo only the clearly COLOURED ones can be
 * recognised — white and grey are everywhere in a garage (walls, concrete),
 * so the user picks those by hand. Pure TypeScript, tested.
 */

export type ZoneColor = "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "white" | "grey";

export const ZONE_COLORS: { key: ZoneColor; hex: string }[] = [
  { key: "red", hex: "#E5484D" },
  { key: "orange", hex: "#F5803E" },
  { key: "yellow", hex: "#F5C400" },
  { key: "green", hex: "#30A46C" },
  { key: "blue", hex: "#2F6FD6" },
  { key: "purple", hex: "#8E4EC6" },
  { key: "white", hex: "#F2F3F5" },
  { key: "grey", hex: "#8B8D98" },
];

export function zoneColorHex(key: string | null | undefined): string | null {
  return ZONE_COLORS.find((c) => c.key === key)?.hex ?? null;
}

export function isZoneColor(v: unknown): v is ZoneColor {
  return ZONE_COLORS.some((c) => c.key === v);
}

/** 0xRRGGBB → hue 0–360, saturation 0–1, value 0–1. */
export function toHsv(rgb: number): { h: number; s: number; v: number } {
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hueBin(h: number): Exclude<ZoneColor, "white" | "grey"> {
  if (h < 14 || h >= 340) return "red";
  if (h < 40) return "orange";
  if (h < 70) return "yellow";
  if (h < 170) return "green";
  if (h < 255) return "blue";
  return "purple";
}

/**
 * The zone colour in a patch of the photo (pixels around the zone / level
 * text), or null. A colour counts only when it covers a good part of the
 * patch — a little red tail-light must not make the zone red.
 */
export function zoneColorFromPixels(pixels: number[], minShare = 0.22): ZoneColor | null {
  if (pixels.length === 0) return null;
  const counts = new Map<ZoneColor, number>();
  for (const p of pixels) {
    const { h, s, v } = toHsv(p);
    if (s < 0.35 || v < 0.25) continue; // grey, white, black, shadows
    const bin = hueBin(h);
    counts.set(bin, (counts.get(bin) ?? 0) + 1);
  }
  let best: ZoneColor | null = null;
  let n = 0;
  for (const [k, c] of counts) {
    if (c > n) {
      best = k;
      n = c;
    }
  }
  return best && n / pixels.length >= minShare ? best : null;
}
