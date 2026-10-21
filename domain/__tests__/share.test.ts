import { coordsLine, shareText } from "../share";

const en: Record<string, string> = {
  "v2.share.here_head": "I'm here:",
  "v2.share.car_head": "My car is parked here:",
  "v2.share.past_head": "Parking spot:",
  "v2.share.place_head": "Favorite place:",
  "v2.share.title_here": "Share where I am",
  "v2.share.title_car": "Share where my car is",
  "v2.share.title_place": "Share this place",
  "v2.parked.level": "Level",
  "v2.parked.zone": "Zone",
  "v2.parked.spot": "Spot",
};
const t = (k: string) => en[k] ?? k;
const URL = "https://maps.google.com/?q=1,2";
const at = { latitude: 42.6469, longitude: 23.3731 };

describe("shareText", () => {
  it("here: heading + address + link", () => {
    const r = shareText({ kind: "here", ...at, address: "bul. Cherni vrah 100, Sofia" }, URL, t);
    expect(r.message).toBe(`I'm here:\nbul. Cherni vrah 100, Sofia\n${URL}`);
    expect(r.title).toBe("Share where I am");
  });

  it("no address → the coordinates line", () => {
    expect(coordsLine(42.6469, 23.3731)).toBe("42.64690, 23.37310");
    const r = shareText({ kind: "here", ...at, address: null }, URL, t);
    expect(r.message).toBe(`I'm here:\n42.64690, 23.37310\n${URL}`);
  });

  it("active parking: heading, name, address, level · zone · spot", () => {
    const r = shareText(
      { kind: "car", ...at, name: "VW – SA63USM", address: "bul. Cherni vrah 100, Sofia", level: "B2", zone: "C", spot: "14" },
      URL,
      t,
    );
    expect(r.message).toBe(`My car is parked here:\nVW – SA63USM\nbul. Cherni vrah 100, Sofia\nLevel B2 · Zone C · Spot 14\n${URL}`);
    expect(r.title).toBe("Share where my car is");
  });

  it("parking without name and details: heading, address, link", () => {
    const r = shareText({ kind: "car", ...at, name: " ", address: "Sofia", level: null, zone: "", spot: null }, URL, t);
    expect(r.message).toBe(`My car is parked here:\nSofia\n${URL}`);
  });

  it("past parking: its own heading, only the saved details", () => {
    const r = shareText({ kind: "pastParking", ...at, address: "Sofia", spot: "A07" }, URL, t);
    expect(r.message).toBe(`Parking spot:\nSofia\nSpot A07\n${URL}`);
    expect(r.title).toBe("Share this place");
  });

  it("place: the name replaces the heading; no name → Favorite place:", () => {
    expect(shareText({ kind: "place", ...at, name: "Gym", address: "ul. Malinov 51, Sofia" }, URL, t).message).toBe(
      `Gym\nul. Malinov 51, Sofia\n${URL}`,
    );
    expect(shareText({ kind: "place", ...at, name: null, address: null }, URL, t).message).toBe(
      `Favorite place:\n42.64690, 23.37310\n${URL}`,
    );
  });

  it("no emoji in any message", () => {
    const r = shareText({ kind: "here", ...at }, URL, t);
    expect(r.message).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
