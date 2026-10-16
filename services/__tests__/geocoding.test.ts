const mockReverseGeocodeAsync = jest.fn();
jest.mock("expo-location", () => ({ reverseGeocodeAsync: (...a: unknown[]) => mockReverseGeocodeAsync(...a) }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const geo = require("../geocoding") as typeof import("../geocoding");

const fetchMock = jest.fn();
(global as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;

beforeEach(() => {
  geo.__resetGeocodingForTests();
  mockReverseGeocodeAsync.mockReset();
  fetchMock.mockReset();
  jest.restoreAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => undefined);
});

test("uses the phone's geocoder", async () => {
  mockReverseGeocodeAsync.mockResolvedValue([{ street: "Vitosha Blvd", streetNumber: "40", city: "Sofia", district: "Center" }]);
  const a = await geo.reverseGeocode(42.69, 23.32);
  expect(a).toMatchObject({ street: "Vitosha Blvd", houseNumber: "40", city: "Sofia", source: "device" });
  expect(geo.streetLine(a)).toBe("Vitosha Blvd 40");
});

test("never calls an external service, even when the phone has no geocoder", async () => {
  mockReverseGeocodeAsync.mockRejectedValue(new Error("Geocoder is not running"));
  expect(await geo.reverseGeocode(42.6977, 23.3219)).toBeNull();
  expect(await geo.reverseGeocode(42.71, 23.35)).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("'Geocoder is not running' → skipped during the back-off, one log line", async () => {
  mockReverseGeocodeAsync.mockRejectedValue(new Error("Geocoder is not running"));
  await geo.reverseGeocode(42.6977, 23.3219);
  await geo.reverseGeocode(42.71, 23.35); // a different place
  expect(mockReverseGeocodeAsync).toHaveBeenCalledTimes(1);
  expect(console.log).toHaveBeenCalledTimes(1);
});

test("after the back-off the geocoder is tried again (transient failure)", async () => {
  const now = jest.spyOn(Date, "now");
  now.mockReturnValue(1_000_000);
  mockReverseGeocodeAsync.mockRejectedValueOnce(new Error("Geocoder is not running"));
  expect(await geo.reverseGeocode(10, 10)).toBeNull();

  now.mockReturnValue(1_000_000 + 60_000); // 1 min later: still backing off
  expect(await geo.reverseGeocode(10, 10)).toBeNull();
  expect(mockReverseGeocodeAsync).toHaveBeenCalledTimes(1);

  now.mockReturnValue(1_000_000 + 3 * 60_000); // after 2 min: retried, now works
  mockReverseGeocodeAsync.mockResolvedValueOnce([{ street: "Main St", city: "Sofia" }]);
  expect(await geo.reverseGeocode(10, 10)).toMatchObject({ street: "Main St", source: "device" });
  expect(mockReverseGeocodeAsync).toHaveBeenCalledTimes(2);
  now.mockRestore();
});

test("same ~11 m cell is served from the cache", async () => {
  mockReverseGeocodeAsync.mockResolvedValue([{ street: "A", city: "B" }]);
  await geo.reverseGeocode(42.69771, 23.32191);
  await geo.reverseGeocode(42.69774, 23.32188);
  expect(mockReverseGeocodeAsync).toHaveBeenCalledTimes(1);
});

test("an empty answer returns null, never throws", async () => {
  mockReverseGeocodeAsync.mockResolvedValue([]);
  await expect(geo.reverseGeocode(1, 2)).resolves.toBeNull();
});

test("street line follows the country's convention", () => {
  expect(geo.streetLine({ street: "бул. Витоша", houseNumber: "40", countryCode: "BG" })).toBe("бул. Витоша 40");
  expect(geo.streetLine({ street: "Abide-i Hürriyet Caddesi", houseNumber: "211", countryCode: "TR" })).toBe("Abide-i Hürriyet Caddesi No:211");
  expect(geo.streetLine({ street: "Avenue des Champs-Élysées", houseNumber: "128", countryCode: "FR" })).toBe("128 Avenue des Champs-Élysées");
  expect(geo.streetLine({ street: "Leopoldstraße", houseNumber: "112", countryCode: "DE" })).toBe("Leopoldstraße 112");
  expect(geo.streetLine({ street: "Main St", houseNumber: null, countryCode: "US" })).toBe("Main St");
  expect(geo.streetLine({ street: "Büyükdere Cd. No:185", houseNumber: "185", countryCode: "TR" })).toBe("Büyükdere Cd. No:185");
  expect(geo.streetLine({ street: null, houseNumber: null, countryCode: "BG" })).toBeNull();
});

test("area line drops a region that repeats the city", () => {
  expect(geo.areaLine({ district: "Младост 3", city: "София", region: "София-град" })).toBe("Младост 3, София");
  expect(geo.areaLine({ district: "Cumhuriyet Mahallesi", city: "Şişli", region: "İstanbul" })).toBe("Cumhuriyet Mahallesi, Şişli, İstanbul");
  expect(geo.areaLine({ district: null, city: "Sofia", region: null })).toBe("Sofia");
  expect(geo.areaLine(null)).toBeNull();
});

test("Bulgarian housing estate: block first, district not repeated (real Samsung answer, Mladost 3)", () => {
  const raw = { street: "ж.к. Младост 3", houseNumber: "бл. 321 А", countryCode: "BG", district: "Mladost", city: "Sofia", region: "Sofia City Province" };
  const line = geo.streetLine(raw);
  expect(line).toBe("бл. 321 А, ж.к. Младост 3");
  expect(geo.areaLine(raw, raw.street)).toBe("Sofia");
  expect(geo.areaLine(raw, line)).toBe("Sofia"); // the Save sheet passes the formatted line
  // an ordinary street keeps its district
  expect(geo.areaLine({ district: "Lozenets", city: "Sofia", region: "Sofia City Province" }, "бул. Черни връх 100")).toBe("Lozenets, Sofia");
});

test("Huawei without Google: street and estate are taken from formattedAddress (real Pura 70 Ultra answer)", async () => {
  mockReverseGeocodeAsync.mockResolvedValue([
    {
      formattedAddress: 'ul. "Sveto preobrazhenie" 327, 1712 g.k. Mladost 3, Sofia, Bulgaria',
      isoCountryCode: "BG", postalCode: "1712", country: "Bulgaria", city: null, name: null, district: null,
      streetNumber: null, region: "Sofia-grad", street: null, subregion: "Sofia",
    },
  ]);
  const a = await geo.reverseGeocode(42.65, 23.38);
  expect(a).toMatchObject({ street: 'ul. "Sveto preobrazhenie" 327', district: "g.k. Mladost 3", city: "Sofia" });
  expect(geo.streetLine(a)).toBe('ul. "Sveto preobrazhenie" 327');
  expect(geo.areaLine(a, a!.street)).toBe("g.k. Mladost 3, Sofia, Bulgaria");
});

test("formattedAddress with only city and country gives no street", () => {
  expect(geo.parseFormattedAddress("1712 Sofia, Bulgaria", ["Bulgaria", "Sofia"], "1712")).toBeNull();
});

test("Huawei, second answer for the same place: only the estate (no street)", () => {
  const p = geo.parseFormattedAddress("1712 ж.к. Младост 3, Sofia, Bulgaria", ["Bulgaria", "Sofia", "Sofia-grad"], "1712");
  expect(p).toEqual({ street: "ж.к. Младост 3", district: null });
  expect(geo.areaLine({ district: null, city: "Sofia", region: "Sofia-grad" }, p!.street)).toBe("Sofia");
});

test("Home shows the area, not the exact address", () => {
  const base = { houseNumber: null, postalCode: null, country: null, countryCode: "BG", source: "device" as const };
  // Samsung, housing estate
  expect(geo.placeLines({ ...base, street: "ж.к. Младост 3", houseNumber: "бл. 321 А", district: "Mladost", city: "Sofia", region: "Sofia City Province" }))
    .toEqual({ area: "ж.к. Младост 3", city: "Sofia" });
  // Huawei, street + estate parsed from formattedAddress
  expect(geo.placeLines({ ...base, street: 'ul. "Sveto preobrazhenie" 327', district: "g.k. Mladost 3", city: "Sofia", region: "Sofia-grad" }))
    .toEqual({ area: "g.k. Mladost 3", city: "Sofia" });
  // İstanbul
  expect(geo.placeLines({ ...base, countryCode: "TR", street: "Abide-i Hürriyet Caddesi", district: "Cumhuriyet Mahallesi", city: "Şişli", region: "İstanbul" }))
    .toEqual({ area: "Cumhuriyet Mahallesi", city: "Şişli, İstanbul" });
  // only a city
  expect(geo.placeLines({ ...base, street: null, district: null, city: "Sofia", region: "Sofia-grad" })).toEqual({ area: "Sofia", city: null });
  expect(geo.placeLines(null)).toEqual({ area: null, city: null });
  // with the country (as the geocoder returns it)
  expect(geo.placeLines({ ...base, country: "Bulgaria", street: "ж.к. Младост 3", district: "Mladost", city: "Sofia", region: "Sofia City Province" }))
    .toEqual({ area: "ж.к. Младост 3", city: "Sofia, Bulgaria" });
  expect(geo.placeLines({ ...base, country: "Türkiye", countryCode: "TR", street: "Abide-i Hürriyet Caddesi", district: "Cumhuriyet Mahallesi", city: "Şişli", region: "İstanbul" }))
    .toEqual({ area: "Cumhuriyet Mahallesi", city: "Şişli, İstanbul, Türkiye" });
  expect(geo.placeLines({ ...base, country: "Bulgaria", street: null, district: null, city: "Sofia", region: "Sofia-grad" }))
    .toEqual({ area: "Sofia", city: "Bulgaria" });
});

test("Home: the estate from the full address line when Google gave a nearby street (real Samsung answers, 14.10)", () => {
  const base = { houseNumber: null, postalCode: "1712", country: "Bulgaria", countryCode: "BG", source: "device" as const };
  // First (quick) fix: an ordinary street, but the line starts with the estate (glued to "Mladost").
  const formatted = 'ж.к. Младост 3Mladost, ul. "Badnina" 321a, 1712 Sofia, Bulgaria';
  expect(geo.estateFromFormatted(formatted)).toBe("ж.к. Младост 3");
  expect(
    geo.placeLines({ ...base, street: 'ulitsa "Badnina"', district: "Mladost", city: "Sofia", region: "Sofia City Province", estate: geo.estateFromFormatted(formatted) }).area,
  ).toBe("ж.к. Младост 3");
  // Huawei / microG line.
  expect(geo.estateFromFormatted('ul. "Sveto preobrazhenie" 327, 1712 g.k. Mladost 3, Sofia, Bulgaria')).toBe("g.k. Mladost 3");
  // No estate anywhere → the district, as before (iPhone, other countries).
  expect(geo.estateFromFormatted("Abide-i Hürriyet Caddesi No:211, 34381 Şişli/İstanbul, Türkiye")).toBeNull();
  expect(geo.placeLines({ ...base, street: 'ulitsa "Badnina"', district: "Mladost", city: "Sofia", region: "Sofia City Province", estate: null }).area).toBe(
    "Mladost",
  );
});
