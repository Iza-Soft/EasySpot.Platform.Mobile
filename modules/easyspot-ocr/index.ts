import { requireOptionalNativeModule } from "expo-modules-core";

export interface OcrFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrLine {
  text: string;
  /** In image pixels, origin top-left (same on Android and iOS). */
  frame: OcrFrame | null;
}

export interface OcrResult {
  /** All text, line by line. */
  text: string;
  lines: OcrLine[];
  width: number;
  height: number;
}

export interface PreparedPhoto {
  /** file:// URI of the saved JPEG (upright, long side ≤ maxSide). */
  uri: string;
  width: number;
  height: number;
}

interface EasySpotOcrNative {
  engine(): string;
  recognizeTextAsync(uri: string): Promise<OcrResult>;
  /** Camera picture → upright, smaller JPEG at dest (the app's own files). Missing in builds before 15.10. */
  preparePhotoAsync?(src: string, dest: string, maxSide: number, quality: number): Promise<PreparedPhoto>;
  /** Colours (0xRRGGBB) of a box [x, y, w, h] of a prepared photo, scaled to size × size. */
  samplePixelsAsync?(uri: string, rect: number[], size: number): Promise<number[]>;
}

/**
 * On-device OCR: ML Kit (bundled model) on Android — also on Huawei without
 * Google services — and Apple Vision on iPhone. null in an old native build.
 */
export const EasySpotOcr: EasySpotOcrNative | null = requireOptionalNativeModule<EasySpotOcrNative>("EasySpotOcr");
