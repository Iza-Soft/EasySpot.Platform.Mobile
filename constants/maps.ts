export enum Maps {
  google = "Google",
  waze = "Waze",
  apple = "Apple",
  bing = "Bing",
}

export enum MapUrl {
  Google = "https://www.google.com/maps/search/?api=1&query=",
  Apple = "https://maps.apple.com/?q=",
  Bing = "https://www.bing.com/maps?q=",
  Waze = "https://waze.com/ul?ll=", // Waze uses latitude,longitude and navigate=yes
}
