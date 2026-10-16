/**
 * How a photo of the spot fills the Parking form (decided 15.10, mockups F4/F5).
 * Pure TypeScript, tested.
 *
 *  - Only what was recognised is filled; everything stays editable.
 *  - A field the user typed is never overwritten. A field the photo filled
 *    (and the user did not change) is replaced by a new photo (Retake).
 *  - The plate goes into Name: empty → "SA63USM"; "Office garage" →
 *    "Office garage - SA63USM"; after Retake only the plate part changes.
 */

/**
 * One field (level, zone, spot, colour).
 * current: what is in the field now; filled: what the previous photo put
 * there (undefined if nothing); next: what the new photo recognised.
 * Returns the new value and what the photo is now "responsible" for.
 */
export function fillField(
  current: string,
  filled: string | undefined,
  next: string | undefined,
): { value: string; filled: string | undefined } {
  const untouched = current.trim() === "" || (filled !== undefined && current === filled);
  if (!next) return { value: current, filled: untouched && current !== "" ? filled : undefined };
  if (untouched) return { value: next, filled: next };
  return { value: current, filled: undefined };
}

/** Name with the plate from the photo. oldPlate: the plate a previous photo put in (Retake). */
export function nameWithPlate(name: string, plate: string | undefined, oldPlate?: string): string {
  if (!plate) return name;
  const trimmed = name.trim();
  if (oldPlate && trimmed.includes(oldPlate)) return trimmed.replace(oldPlate, plate);
  if (!trimmed) return plate;
  if (trimmed.includes(plate)) return trimmed;
  return `${trimmed} - ${plate}`;
}
