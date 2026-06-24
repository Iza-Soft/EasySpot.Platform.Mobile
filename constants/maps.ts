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
    emoji: "🗺️",
    available: "Android & iOS",
  },
  { id: Maps.waze, label: "Waze", emoji: "🚗", available: "Android & iOS" },
  {
    id: Maps.here,
    label: "HERE WeGo",
    emoji: "📍",
    available: "Android & iOS",
  },
  {
    id: Maps.bing,
    label: "Bing Maps",
    emoji: "🔵",
    available: "Android & iOS",
  },
  { id: Maps.apple, label: "Apple Maps", emoji: "🍎", available: "iOS only" },
  {
    id: Maps.osm,
    label: "OpenStreetMap",
    emoji: "🌍",
    available: "Android & iOS",
  },
];
