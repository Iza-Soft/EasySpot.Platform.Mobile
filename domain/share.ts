/**
 * The text sent by "Share" (mockups SH1–SH5): says WHAT is shared, then the
 * address (or the coordinates when there is no address), then the map link.
 * No emoji, no signature. Pure — the service adds the GPS fix and the link.
 *
 *   I'm here:                 My car is parked here:      Gym                Favorite place:
 *   bul. Cherni vrah 100      VW – SA63USM (its name)     ul. Malinov 51     42.64690, 23.37310
 *   <link>                    bul. Cherni vrah 100        <link>             <link>
 *                             Level B2 · Zone C · Spot 14
 *                             <link>
 */

export type ShareKind = "here" | "car" | "pastParking" | "place";

export interface ShareSubject {
  kind: ShareKind;
  latitude: number;
  longitude: number;
  /** The user's name for it ("Gym", "VW – SA63USM"); here: unused. */
  name?: string | null;
  /** "bul. Cherni vrah 100, Sofia"; null → the coordinates line. */
  address?: string | null;
  /** Already shown the user's way (B2 / −2). */
  level?: string | null;
  zone?: string | null;
  spot?: string | null;
}

type T = (key: string) => string;

/** "42.64690, 23.37310" — pastes into any map, even where the link doesn't open. */
export function coordsLine(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

const clean = (v?: string | null) => v?.trim() || null;

export function shareText(s: ShareSubject, url: string, t: T): { message: string; title: string } {
  const name = clean(s.name);
  const where = clean(s.address) ?? coordsLine(s.latitude, s.longitude);
  const lines: string[] = [];

  if (s.kind === "here") {
    lines.push(t("v2.share.here_head"), where);
  } else if (s.kind === "place") {
    // A place's name says what it is ("Gym", "Home"); without one, the heading does.
    lines.push(name ?? t("v2.share.place_head"), where);
  } else {
    // A parking's name is often the car or the plate, so the heading always comes first.
    lines.push(t(s.kind === "car" ? "v2.share.car_head" : "v2.share.past_head"));
    if (name && name !== clean(s.address)) lines.push(name);
    lines.push(where);
    const details = [
      clean(s.level) && `${t("v2.parked.level")} ${clean(s.level)}`,
      clean(s.zone) && `${t("v2.parked.zone")} ${clean(s.zone)}`,
      clean(s.spot) && `${t("v2.parked.spot")} ${clean(s.spot)}`,
    ].filter(Boolean);
    if (details.length) lines.push(details.join(" · "));
  }
  lines.push(url);

  const title = t(s.kind === "here" ? "v2.share.title_here" : s.kind === "car" ? "v2.share.title_car" : "v2.share.title_place");
  return { message: lines.join("\n"), title };
}
