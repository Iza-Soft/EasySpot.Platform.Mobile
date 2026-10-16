import { File } from "expo-file-system";
import { EasySpotOcr, OcrLine, OcrResult } from "../modules/easyspot-ocr";
import { findPlate, Plate } from "../domain/plate";
import { ZoneColor, zoneColorFromPixels } from "../domain/zone-color";
import { pillarFromResult, recognizeText } from "./ocr-service";
import { deleteTempFile, newPhotoTarget } from "./spot-photos";

/**
 * Photo of the spot (mockups F2–F4): the camera picture is made smaller and
 * kept in the app's own files, then read on the phone — level / zone / spot,
 * the car plate and the zone colour. Nothing leaves the phone.
 */

/** Long side of the kept photo: sharp enough to read, ~300–600 KB. */
const MAX_SIDE = 1920;
const QUALITY = 0.75;

export interface PhotoScan {
  level?: string;
  zone?: string;
  spot?: string;
  plate?: Plate;
  color?: ZoneColor;
}

export interface SavedPhoto {
  /** Relative path stored with the parking ("photos/spot-….jpg"). */
  rel: string;
  /** file:// URI for showing it. */
  uri: string;
}

/** Camera picture (temporary) → the app's photos folder. The temporary picture is removed. */
export async function keepPhoto(cameraUri: string): Promise<SavedPhoto> {
  const target = newPhotoTarget();
  if (EasySpotOcr?.preparePhotoAsync) {
    const out = await EasySpotOcr.preparePhotoAsync(cameraUri, target.uri, MAX_SIDE, QUALITY);
    deleteTempFile(cameraUri);
    return { rel: target.rel, uri: out.uri };
  }
  // Older native build: keep the camera file as it is (moved, not resized).
  await new File(cameraUri).move(new File(target.uri));
  return { rel: target.rel, uri: target.uri };
}

/** The line most likely painted on the zone sign (for the colour): the zone letter, else the level. */
function colourLine(lines: OcrLine[], scan: PhotoScan): OcrLine | null {
  const tokens = (l: OcrLine) => l.text.toUpperCase().replace(/[^A-Z0-9-]/g, " ").split(/\s+/).filter(Boolean);
  const byHeight = [...lines].filter((l) => l.frame).sort((a, b) => b.frame!.height - a.frame!.height);
  for (const want of [scan.zone, scan.level]) {
    if (!want) continue;
    const hit = byHeight.find((l) => tokens(l).includes(want.toUpperCase()));
    if (hit) return hit;
  }
  return null;
}

/** A box around the text: the painted band usually reaches well beyond the letters. */
function bandAround(line: OcrLine, r: Pick<OcrResult, "width" | "height">): number[] {
  const f = line.frame!;
  const padX = Math.max(f.width * 0.6, f.height * 0.6);
  const padY = f.height * 0.5;
  const x = Math.max(0, Math.round(f.x - padX));
  const y = Math.max(0, Math.round(f.y - padY));
  const w = Math.min(r.width - x, Math.round(f.width + padX * 2));
  const h = Math.min(r.height - y, Math.round(f.height + padY * 2));
  return [x, y, Math.max(1, w), Math.max(1, h)];
}

/** Reads the kept photo. Never throws: a photo that can't be read just fills nothing. */
export async function scanSpotPhoto(uri: string): Promise<PhotoScan> {
  let result: OcrResult;
  try {
    result = await recognizeText(uri);
  } catch (e) {
    console.warn("photo text recognition failed:", e);
    return {};
  }
  const plate = findPlate(result.lines);
  // The plate's line is not a pillar sign (a BG plate's "1234" is not a spot).
  const signLines = plate ? result.lines.filter((_, i) => i !== plate.line) : result.lines;
  const fields = pillarFromResult({ lines: signLines });
  const scan: PhotoScan = { ...fields };
  if (plate) scan.plate = { display: plate.display, compact: plate.compact };

  const line = colourLine(signLines, scan);
  if (line && EasySpotOcr?.samplePixelsAsync) {
    try {
      const pixels = await EasySpotOcr.samplePixelsAsync(uri, bandAround(line, result), 24);
      scan.color = zoneColorFromPixels(pixels) ?? undefined;
    } catch (e) {
      console.warn("zone colour failed:", e);
    }
  }
  return scan;
}
