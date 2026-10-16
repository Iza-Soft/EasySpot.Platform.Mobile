jest.mock("expo-location", () => ({ reverseGeocodeAsync: jest.fn() }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = require("../hereStore") as typeof import("../hereStore");

beforeEach(() => store.__resetHereForTests());

const addr = {
  street: "ж.к. Младост 3", houseNumber: "бл. 321 А", district: "Mladost", city: "Sofia", region: "Sofia City Province",
  postalCode: "1712", country: "Bulgaria", countryCode: "BG", source: "device" as const,
};

test("the newest measurement wins: Home and the Save sheet show the same accuracy", () => {
  store.publishHere({ accuracy: 18 }, addr); // Home, quick
  store.publishHere({ accuracy: 9 }, addr); // Save sheet, fresh
  expect(store.getHere()).toMatchObject({ status: "ok", area: "ж.к. Младост 3", city: "Sofia, Bulgaria", accuracy: 9 });
});

test("an error does not wipe a known place", () => {
  store.publishHere({ accuracy: 12 }, addr);
  store.publishHereError();
  expect(store.getHere()).toMatchObject({ status: "ok", accuracy: 12 });
});

test("an error before any fix is shown as an error", () => {
  store.publishHereError();
  expect(store.getHere()).toEqual({ status: "error" });
});
