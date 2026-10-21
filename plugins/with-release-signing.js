/**
 * Expo config plugin: signs the release build (bundleRelease / assembleRelease)
 * with the Play upload key, and keeps doing it after `expo prebuild --clean`.
 *
 * The key is NOT in the repo. Gradle reads it at build time from
 * `credentials.json` in the project root (the EAS "local credentials" format):
 *   { "android": { "keystore": { "keystorePath": "credentials/android/keystore.jks",
 *       "keystorePassword": "…", "keyAlias": "…", "keyPassword": "…" } } }
 * credentials.json and *.jks are in .gitignore. Without the file the release
 * build stays signed with the debug key (fine for local tests, refused by Play).
 */
const { withAppBuildGradle } = require("expo/config-plugins");

const MARK = "// easyspot: release signing";

const HEADER = `${MARK}
def easyspotCredsFile = rootProject.file("../credentials.json")
def easyspotUploadKey = easyspotCredsFile.exists() ? new groovy.json.JsonSlurper().parse(easyspotCredsFile).android.keystore : null
`;

const RELEASE_CONFIG = `
        release {
            if (easyspotUploadKey != null) {
                storeFile rootProject.file("../" + easyspotUploadKey.keystorePath)
                storePassword easyspotUploadKey.keystorePassword
                keyAlias easyspotUploadKey.keyAlias
                keyPassword easyspotUploadKey.keyPassword
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes(MARK)) return cfg;

    // 1. Read credentials.json (before the android { } block).
    g = g.replace(/^android\s*\{/m, (m) => `${HEADER}\n${m}`);

    // 2. A "release" signing config next to "debug".
    g = g.replace(/(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/, `$1${RELEASE_CONFIG}`);

    // 3. The release build type uses it when the key is there.
    g = g.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig easyspotUploadKey != null ? signingConfigs.release : signingConfigs.debug",
    );

    if (!g.includes("easyspotUploadKey != null ? signingConfigs.release")) {
      throw new Error("with-release-signing: android/app/build.gradle has an unexpected shape — release signing not added");
    }
    cfg.modResults.contents = g;
    return cfg;
  });
};
