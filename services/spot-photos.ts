import { Directory, File, Paths } from "expo-file-system";
import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Photos of parked spots — only in the app's own files (never the gallery).
 *
 * The database keeps a RELATIVE path ("photos/spot-….jpg"): on iPhone the
 * app's folder gets a new absolute path after every update, so an absolute
 * file:// URI would break.
 *
 * A photo is deleted only (decided 15.10): Remove, Retake + Save (the old one),
 * closing Parking without Save, deleting the parking — and here, on start,
 * files that belong to no parking (the app was killed before Save).
 */
const DIR = "photos";

function photosDir(): Directory {
  const dir = new Directory(Paths.document, DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** A new, empty place for a photo: the relative path to store + the file:// URI to write to. */
export function newPhotoTarget(): { rel: string; uri: string } {
  const name = `spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  return { rel: `${DIR}/${name}`, uri: new File(photosDir(), name).uri };
}

/** file:// URI for showing a stored photo (null if none). */
export function photoUri(rel: string | null | undefined): string | null {
  if (!rel) return null;
  try {
    return new File(Paths.document, rel).uri;
  } catch {
    return null;
  }
}

export function deletePhoto(rel: string | null | undefined): void {
  if (!rel) return;
  try {
    const f = new File(Paths.document, rel);
    if (f.exists) f.delete();
  } catch (e) {
    console.warn("delete photo failed:", e);
  }
}

/** A file outside the photos folder (the camera's temporary picture). */
export function deleteTempFile(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // the system cleans its cache folder anyway
  }
}

/** On start: removes photos that no parking points to. Returns how many. */
export async function cleanOrphanPhotos(db: SQLiteDatabase): Promise<number> {
  const rows = await db.getAllAsync<{ photoUri: string }>("SELECT photoUri FROM locations WHERE photoUri IS NOT NULL");
  const keep = new Set(rows.map((r) => r.photoUri));
  let n = 0;
  for (const item of photosDir().list()) {
    if (item instanceof File && !keep.has(`${DIR}/${item.name}`)) {
      try {
        item.delete();
        n++;
      } catch {
        // try again next start
      }
    }
  }
  return n;
}
