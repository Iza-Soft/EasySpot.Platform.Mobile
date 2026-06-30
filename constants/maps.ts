export enum Maps {
  google = "Google",
  waze = "Waze",
  apple = "Apple",
  bing = "Bing",
  here = "Here",
  osm = "OpenStreetMap",
}

export enum MapUrl {
  Google = "https://www.google.com/maps/search/?api=1&query=",
  Apple = "https://maps.apple.com/?q=",
  Bing = "https://www.bing.com/maps?q=",
  Waze = "https://waze.com/ul?ll=", // Waze uses latitude,longitude and navigate=yes
  Here = "https://share.here.com/l/",
  OpenStreetMap = "https://www.openstreetmap.org/?mlat=",
}

export const MAP_PROVIDERS = [
  {
    id: Maps.google,
    label: "Google Maps",
    brandColor: "#4285F4",
    initial: "G",
    available: "Android & iOS",
  },
  {
    id: Maps.waze,
    label: "Waze",
    brandColor: "#33CCFF",
    initial: "W",
    available: "Android & iOS",
  },
  {
    id: Maps.here,
    label: "HERE WeGo",
    brandColor: "#00AFAA",
    initial: "H",
    available: "Android & iOS",
  },
  {
    id: Maps.bing,
    label: "Bing Maps",
    brandColor: "#0078D4",
    initial: "B",
    available: "Android & iOS",
  },
  {
    id: Maps.apple,
    label: "Apple Maps",
    brandColor: "#000000",
    initial: "A",
    available: "iOS only",
  },
  {
    id: Maps.osm,
    label: "OpenStreetMap",
    brandColor: "#7EBC6F",
    initial: "OSM",
    available: "Android & iOS",
  },
];
