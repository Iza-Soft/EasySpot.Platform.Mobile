import { deviceReverseGeocode } from "../platform/geocoder";

/**
 * Coordinates → address, using ONLY the phone's own geocoder
 * (Android Geocoder / Apple CLGeocoder via expo-location). No external
 * service, no API key, nothing paid.
 *
 * The address is a convenience: spots are saved and found by coordinates.
 * When the phone has no geocoder (typically Huawei without Google services)
 * the UI shows the GPS accuracy instead of a street.
 *
 * "Geocoder is not running" happens both permanently (no geocoder on the
 * phone) and temporarily on phones WITH one (seen on a Samsung S22+). So a
 * failure is not final: the geocoder is skipped for a back-off period
 * (2 → 4 → 8 … max 30 min) and then tried again. One log line per failure,
 * not one per screen focus. Results are cached per ~11 m cell.
 * Every failure resolves to null, never throws.
 */

export interface GeoAddress {
  street: string | null;
  houseNumber: string | null;
  district: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  /** ISO 3166-1 alpha-2, e.g. "BG", "TR" — decides how the street line is written. */
  countryCode: string | null;
  /**
   * A housing estate / quarter found in the full address line when the geocoder
   * returned an ordinary street ("ж.к. Младост 3" while street = "ul. Badnina").
   * Lets Home show the estate consistently; null when there is none.
   */
  estate?: string | null;
  source: "device";
}

const BACKOFF_START_MS = 2 * 60_000;
const BACKOFF_MAX_MS = 30 * 60_000;
let deviceRetryAt = 0;
let deviceBackoffMs = 0;
const cache = new Map<string, GeoAddress | null>();

const cellKey = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoAddress | null> {
  const key = cellKey(latitude, longitude);
  if (cache.has(key)) return cache.get(key)!;

  const result = await fromDevice(latitude, longitude);
  // Only real addresses are cached: a miss may succeed later (geocoder recovered).
  if (result) cache.set(key, result);
  return result;
}

/** Countries that write the house number BEFORE the street ("128 Avenue des Champs-Élysées"). */
const NUMBER_FIRST = new Set(["FR", "LU", "MC", "US", "CA", "GB", "IE", "AU", "NZ"]);

/**
 * The street line written the way the country writes it:
 *   BG, DE, most of Europe → "Vitosha Blvd 40"
 *   TR                     → "Abide-i Hürriyet Caddesi No:211"
 *   FR, US, GB …           → "128 Avenue des Champs-Élysées"
 */
export function streetLine(a: Pick<GeoAddress, "street" | "houseNumber" | "countryCode"> | null): string | null {
  if (!a) return null;
  const street = a.street?.trim() || null;
  const no = a.houseNumber?.trim() || null;
  if (!street) return no;
  if (!no || street.includes(no)) return street;
  const cc = a.countryCode?.toUpperCase();
  // Bulgarian housing estates have no street: the geocoder puts the estate in
  // "street" and the block in "number" ("ж.к. Младост 3" + "бл. 321 А").
  // The block is the specific part, so it goes first.
  if (isBlock(no)) return `${no}, ${street}`;
  if (cc === "TR") return `${street} No:${no}`;
  if (cc && NUMBER_FIRST.has(cc)) return `${no} ${street}`;
  return `${street} ${no}`;
}

const isBlock = (no: string) => /^(бл\.?|bl\.?|блок)\s*\S/i.test(no);
/** "ж.к. Младост 3", "жк Люлин 5", "kv. Lozenets" — an estate/quarter, not a street. */
// Matches the raw street or the formatted line ("бл. 321 А, ж.к. Младост 3").
const isEstate = (street: string | null | undefined) =>
  !!street && /(^|,\s*)(ж\.?\s?к\.?|кв\.|zh\.?\s?k\.?|g\.\s?k\.|kv\.)\s/i.test(street.trim());

/**
 * The estate inside a full address line, if any:
 *   "ж.к. Младост 3Mladost, ul. \"Badnina\" 321a, 1712 Sofia" → "ж.к. Младост 3"
 *     (Google glues the Latin district on without a comma — cut there)
 *   "ul. \"Sveto preobrazhenie\" 327, 1712 g.k. Mladost 3, Sofia" → "g.k. Mladost 3" (Huawei / microG)
 */
export function estateFromFormatted(formatted: string | null | undefined): string | null {
  if (!formatted) return null;
  for (const raw of formatted.split(",")) {
    let p = raw.trim().replace(/^\d{3,6}\s+/, ""); // leading postal code
    const glued = /[^\s][A-Z][a-z]/.exec(p);
    if (glued) p = p.slice(0, glued.index + 1);
    if (isEstate(p)) return p.trim();
  }
  return null;
}

/**
 * "Cumhuriyet Mahallesi, Şişli, İstanbul" / "Младост 3, София".
 * The region is added only when it is not just the city again
 * ("София" + "София-град" → "София").
 */
export function areaLine(
  a: { district?: string | null; city?: string | null; region?: string | null; country?: string | null } | null,
  street?: string | null,
): string | null {
  if (!a) return null;
  const parts: string[] = [];
  const add = (v?: string | null) => {
    const x = v?.trim();
    if (!x) return;
    const lx = x.toLocaleLowerCase();
    if (parts.some((p) => p.toLocaleLowerCase().includes(lx) || lx.includes(p.toLocaleLowerCase()))) return;
    parts.push(x);
  };
  // The estate in the street line already names the district ("ж.к. Младост 3" ≈ "Mladost").
  if (!isEstate(street)) add(a.district);
  add(a.city);
  add(a.region);
  add(a.country);
  return parts.join(", ") || null;
}

/**
 * Home shows WHERE you are, not the exact address (that is in the Save sheet,
 * measured fresh): the neighbourhood big, the city small. It does not change
 * with 10–20 m of GPS jitter, so Home and the Save sheet never disagree.
 *   BG estate  → "ж.к. Младост 3" / "Sofia, Bulgaria"
 *   İstanbul   → "Cumhuriyet Mahallesi" / "Şişli, İstanbul, Türkiye"
 *   no district → "Sofia" / "Bulgaria"
 */
export function placeLines(a: GeoAddress | null): { area: string | null; city: string | null } {
  if (!a) return { area: null, city: null };
  // A Bulgarian estate beats the Latin district ("Mladost"): from "street" ("ж.к. Младост 3"),
  // else from the full address line (the geocoder gave a nearby ordinary street); else the district.
  const area = (isEstate(a.street) ? a.street : null) ?? a.estate ?? a.district ?? null;
  const city = areaLine({ city: a.city, region: a.region });
  // No neighbourhood: the city goes big, the country small.
  if (!area) return { area: city, city: areaLine({ country: a.country }) };
  return { area, city: areaLine({ city: a.city, region: a.region, country: a.country }) };
}

/**
 * "ul. \"Sveto preobrazhenie\" 327, 1712 g.k. Mladost 3, Sofia, Bulgaria"
 *   → street "ul. \"Sveto preobrazhenie\" 327", district "g.k. Mladost 3".
 * Parts that are the country/city/region (or only a postal code) are dropped;
 * the first remaining part is the street line, the next one the district.
 */
export function parseFormattedAddress(
  formatted: string | null | undefined,
  known: (string | null | undefined)[],
  postalCode?: string | null,
): { street: string | null; district: string | null } | null {
  if (!formatted) return null;
  const knownLc = known.filter(Boolean).map((k) => k!.trim().toLocaleLowerCase());
  const parts = formatted
    .split(",")
    .map((p) => (postalCode ? p.replace(postalCode, "") : p).trim())
    .filter((p) => p && !/^\d+$/.test(p) && !knownLc.includes(p.toLocaleLowerCase()));
  if (!parts.length) return null;
  return { street: parts[0], district: parts[1] ?? null };
}

async function fromDevice(latitude: number, longitude: number): Promise<GeoAddress | null> {
  if (Date.now() < deviceRetryAt) return null;
  try {
    // Android: Kotlin (android.location.Geocoder); iPhone: Core Location.
    const a = await deviceReverseGeocode(latitude, longitude);
    deviceBackoffMs = 0;
    // Dev builds only: what the phone's geocoder really returns (street vs. block names differ by country).
    if (__DEV__) console.log("ℹ️ Geocoder raw:", JSON.stringify(a));
    if (!a) return null;
    const city = a.city ?? a.subregion ?? null;
    // Huawei (no Google) fills ONLY formattedAddress — take street and estate from it.
    const fromText =
      !a.street && !a.name ? parseFormattedAddress(a.formattedAddress, [a.country, city, a.region, a.subregion], a.postalCode) : null;
    return {
      street: a.street ?? a.name ?? fromText?.street ?? null,
      houseNumber: a.streetNumber ?? null,
      district: a.district ?? fromText?.district ?? null,
      city,
      region: a.region ?? null,
      postalCode: a.postalCode ?? null,
      country: a.country ?? null,
      countryCode: a.isoCountryCode ? a.isoCountryCode.toUpperCase() : null,
      estate: estateFromFormatted(a.formattedAddress),
      source: "device",
    };
  } catch (e) {
    deviceBackoffMs = Math.min(BACKOFF_MAX_MS, deviceBackoffMs ? deviceBackoffMs * 2 : BACKOFF_START_MS);
    deviceRetryAt = Date.now() + deviceBackoffMs;
    console.log(
      `ℹ️ Device geocoder unavailable (${e instanceof Error ? e.message : e}) — no street for now; retrying in ${deviceBackoffMs / 60_000} min.`,
    );
    return null;
  }
}

/** Test hook. */
export function __resetGeocodingForTests() {
  deviceRetryAt = 0;
  deviceBackoffMs = 0;
  cache.clear();
}
