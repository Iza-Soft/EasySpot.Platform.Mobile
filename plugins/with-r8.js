/**
 * Expo config plugin: R8 for release builds (Google Play: "DEX code optimization
 * is below our threshold" — deadline February 2027).
 *
 * - gradle.properties: minify (R8: shrink + optimise + obfuscate code) and shrink
 *   unused resources — the Expo template reads these two properties.
 * - proguard-rules.pro: keep our own native code by name. Expo modules, the
 *   React Native module and the alarm receiver are found by class name at run
 *   time (reflection / AndroidManifest), so R8 must not rename or drop them.
 *   The libraries we use (React Native, Expo, ML Kit, SQLite, camera) bring
 *   their own keep rules.
 *
 * Runs on every `npx expo prebuild`, so the android/ folder can be regenerated.
 */
const { withDangerousMod, withGradleProperties } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARK = "# EasySpot (plugins/with-r8.js)";
const RULES = `
${MARK}
# Our Kotlin: Expo modules (location, OCR), ParkingModule + alarm/boot receivers.
-keep class com.ilkoadamov.easyspot.** { *; }
-keepnames class com.ilkoadamov.easyspot.** { *; }
# Readable crash reports in Play Console (with the mapping file).
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
`;

function setProp(props, key, value) {
  const existing = props.find((p) => p.type === "property" && p.key === key);
  if (existing) existing.value = value;
  else props.push({ type: "property", key, value });
}

module.exports = function withR8(config) {
  config = withGradleProperties(config, (cfg) => {
    setProp(cfg.modResults, "android.enableMinifyInReleaseBuilds", "true");
    setProp(cfg.modResults, "android.enableShrinkResourcesInReleaseBuilds", "true");
    return cfg;
  });
  return withDangerousMod(config, [
    "android",
    (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, "app", "proguard-rules.pro");
      const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      if (!current.includes(MARK)) fs.writeFileSync(file, current.trimEnd() + "\n" + RULES);
      return cfg;
    },
  ]);
};
