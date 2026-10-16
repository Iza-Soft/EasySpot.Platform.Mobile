/**
 * Expo config plugin: installs the native parking reminder (AlarmManager)
 * into android/ on every `npx expo prebuild`.
 *
 * Replaces the 1.x "copy patches/ into android/ by hand" step:
 *  1. copies plugins/parking/android/*.kt into the app package folder
 *     (the `package` line is rewritten to android.package from app.config.ts)
 *  2. copies the notification strings (values, values-bg, …) as parking_strings.xml
 *  3. registers ParkingPackage in MainApplication.kt
 *  4. declares ParkingReceiver and ParkingBootReceiver (restart / app update →
 *     reminders scheduled again) in AndroidManifest.xml
 */
const fs = require("fs");
const path = require("path");
const { withDangerousMod, withMainApplication, withAndroidManifest } = require("expo/config-plugins");

const SRC = path.join(__dirname, "parking", "android");
const KOTLIN_FILES = ["ParkingModule.kt", "ParkingPackage.kt", "ParkingReceiver.kt", "ParkingAlarms.kt", "ParkingBootReceiver.kt"];

function withParkingSources(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const pkg = cfg.android?.package;
      if (!pkg) throw new Error("with-parking-module: android.package is not set");
      const mainDir = path.join(cfg.modRequest.platformProjectRoot, "app", "src", "main");

      const javaDir = path.join(mainDir, "java", ...pkg.split("."));
      fs.mkdirSync(javaDir, { recursive: true });
      for (const file of KOTLIN_FILES) {
        const source = fs.readFileSync(path.join(SRC, file), "utf8");
        fs.writeFileSync(path.join(javaDir, file), source.replace(/^package\s+[\w.]+/m, `package ${pkg}`));
      }

      const resSrc = path.join(SRC, "res");
      for (const folder of fs.readdirSync(resSrc)) {
        const target = path.join(mainDir, "res", folder);
        fs.mkdirSync(target, { recursive: true });
        fs.copyFileSync(path.join(resSrc, folder, "parking_strings.xml"), path.join(target, "parking_strings.xml"));
      }
      return cfg;
    },
  ]);
}

function withParkingPackage(config) {
  return withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (!src.includes("ParkingPackage()")) {
      const anchor = /PackageList\(this\)\.packages\.apply\s*\{/;
      if (!anchor.test(src)) {
        throw new Error("with-parking-module: could not find PackageList in MainApplication — template changed?");
      }
      src = src.replace(anchor, (m) => `${m}\n          add(ParkingPackage())`);
    }
    cfg.modResults.contents = src;
    return cfg;
  });
}

function withParkingReceiver(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    app.receiver = app.receiver ?? [];
    if (!app.receiver.some((r) => r.$["android:name"] === ".ParkingReceiver")) {
      // directBootAware: the reminder can fire after a restart even before the phone is unlocked.
      app.receiver.push({ $: { "android:name": ".ParkingReceiver", "android:exported": "false", "android:directBootAware": "true" } });
    }
    if (!app.receiver.some((r) => r.$["android:name"] === ".ParkingBootReceiver")) {
      const actions = [
        "android.intent.action.LOCKED_BOOT_COMPLETED",
        "android.intent.action.BOOT_COMPLETED",
        "android.intent.action.MY_PACKAGE_REPLACED",
        "android.intent.action.QUICKBOOT_POWERON",
        "com.htc.intent.action.QUICKBOOT_POWERON",
        // "Alarms & reminders" turned on → reminders set while it was off become exact.
        "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED",
      ];
      app.receiver.push({
        $: { "android:name": ".ParkingBootReceiver", "android:exported": "true", "android:directBootAware": "true" },
        "intent-filter": [{ action: actions.map((a) => ({ $: { "android:name": a } })) }],
      });
    }
    return cfg;
  });
}

/**
 * Android 11+ hides other apps' screens unless declared: without these the
 * Reminders screen could not tell whether the phone has a page for
 * "App launch" / "Autostart" / Battery before opening it (Huawei shows a stuck
 * "No apps can perform this action" sheet otherwise).
 */
function withReminderQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries ?? [{}];
    const q = manifest.queries[0];
    q.intent = q.intent ?? [];
    const actions = ["miui.intent.action.OP_AUTO_START", "android.intent.action.POWER_USAGE_SUMMARY"];
    for (const a of actions) {
      if (!q.intent.some((i) => i.action?.some((x) => x.$?.["android:name"] === a))) {
        q.intent.push({ action: [{ $: { "android:name": a } }] });
      }
    }
    // The phone-manager apps whose App launch / Autostart pages we check before opening.
    q.package = q.package ?? [];
    for (const name of ["com.huawei.systemmanager", "com.hihonor.systemmanager", "com.miui.securitycenter"]) {
      if (!q.package.some((p) => p.$?.["android:name"] === name)) q.package.push({ $: { "android:name": name } });
    }
    return cfg;
  });
}

module.exports = function withParkingModule(config) {
  config = withReminderQueries(config);
  config = withParkingSources(config);
  config = withParkingPackage(config);
  config = withParkingReceiver(config);
  return config;
};
