const { withAndroidManifest } = require("expo/config-plugins");

/**
 * expo-notifications is NOT in the Android build (package.json autolinking
 * exclude) — reminders are Kotlin only. Its config plugin still runs (it makes
 * @drawable/notification_icon, used by ParkingReceiver), but its Firebase /
 * expo-notifications <meta-data> would point at code that isn't there: drop them.
 */
module.exports = function withoutNotificationsMetaData(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app?.["meta-data"]) {
      app["meta-data"] = app["meta-data"].filter((m) => {
        const name = m.$?.["android:name"] ?? "";
        return !name.startsWith("com.google.firebase.messaging.") && !name.startsWith("expo.modules.notifications.");
      });
    }
    return cfg;
  });
}
