/**
 * Expo config plugin: Android 11+ package visibility for the navigation apps.
 *
 * Without <queries>, Android hides other apps from us. The geo: intent entry
 * lets Kotlin listMapApps() find EVERY installed map app (Settings lists only
 * those); the packages are the known ones, for older native builds. No
 * QUERY_ALL_PACKAGES (Google Play restricts it).
 */
const { withAndroidManifest } = require("expo/config-plugins");

const PACKAGES = [
  "com.google.android.apps.maps", // Google Maps
  "com.waze", // Waze
  "com.huawei.maps.app", // Petal Maps (Huawei)
  "com.here.app.maps", // HERE WeGo
  "com.sygic.aura", // Sygic
  "com.tomtom.gplay.navapp", // TomTom GO
  "com.generalmagic.magicearth", // Magic Earth
  "app.organicmaps", // Organic Maps
  "net.osmand", // OsmAnd
  "net.osmand.plus", // OsmAnd+
  "ru.yandex.yandexmaps", // Yandex Maps
];

module.exports = function withMapQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries ?? [{}];
    const q = manifest.queries[0];
    q.package = q.package ?? [];
    for (const name of PACKAGES) {
      if (!q.package.some((p) => p.$?.["android:name"] === name)) q.package.push({ $: { "android:name": name } });
    }
    // Any app that can show a geo: point (used to open the chosen app with our coordinates).
    q.intent = q.intent ?? [];
    const hasGeo = q.intent.some((i) => i.data?.some((d) => d.$?.["android:scheme"] === "geo"));
    if (!hasGeo) {
      q.intent.push({ action: [{ $: { "android:name": "android.intent.action.VIEW" } }], data: [{ $: { "android:scheme": "geo" } }] });
    }
    return cfg;
  });
};
