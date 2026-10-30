import { ExpoConfig } from "expo/config";

/**
 * EasySpot 2.0 app config (replaces app.json).
 *
 * One Android binary serves BOTH Google Play and Huawei AppGallery: Google vs
 * Huawei differences are handled at runtime (platform/services.ts).
 * EASYSPOT_STORE only changes store links ("Rate us", "Get the app"):
 *   EASYSPOT_STORE=appgallery npx expo run:android --variant release
 */
const STORE = (process.env.EASYSPOT_STORE ?? "play") as "play" | "appgallery" | "appstore";

const VERSION = "2.1.0";
const ANDROID_VERSION_CODE = 7; // 1.2.0 = 4, 2.0.0 = 5, 2.0.1 = 6 — must always increase
const IOS_BUILD_NUMBER = "1";

const config: ExpoConfig = {
  name: "EasySpot",
  slug: "easyspot",
  owner: "i.z.adamov",
  // easyspot://spot/<id> — reminder / "next alarm" tap opens that parking (navigation/linking.ts).
  scheme: "easyspot",
  version: VERSION,
  orientation: "portrait",
  icon: "./assets/v2/icon.png",
  userInterfaceStyle: "automatic",
  backgroundColor: "#0E0F13",
  ios: {
    bundleIdentifier: "com.ilkoadamov.easyspot",
    buildNumber: IOS_BUILD_NUMBER,
    supportsTablet: false,
    // Parking reminders are "Time Sensitive": they come through Focus / Do Not Disturb (free capability).
    entitlements: { "com.apple.developer.usernotifications.time-sensitive": true },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "EasySpot saves where you parked and guides you back to your car.",
      NSCameraUsageDescription:
        "EasySpot keeps a photo of where you parked (only on this phone) and reads the level, zone, spot and car plate from it, or the time from a parking ticket.",
      NSMotionUsageDescription:
        "EasySpot uses motion and air-pressure sensors to work out which garage level you parked on.",
      ITSAppUsesNonExemptEncryption: false,
      // Settings checks which navigation apps are installed (canOpenURL).
      // Map apps EasySpot may find on an iPhone (Apple lets us check only these).
      LSApplicationQueriesSchemes: ["comgooglemaps", "waze", "here-location", "com.sygic.aura", "tomtomgo", "magicearth", "om", "osmandmaps", "yandexmaps"],
    },
  },
  android: {
    package: "com.ilkoadamov.easyspot",
    versionCode: ANDROID_VERSION_CODE,
    adaptiveIcon: {
      foregroundImage: "./assets/v2/adaptive-foreground.png",
      monochromeImage: "./assets/v2/adaptive-monochrome.png",
      backgroundColor: "#C8F135",
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.WAKE_LOCK",
      "android.permission.VIBRATE",
      // Exact parking reminders. USE_EXACT_ALARM (granted on install, Android 13+)
      // is kept on purpose: on Huawei SCHEDULE_EXACT_ALARM alarms arrive late
      // (seen in Hayya). SCHEDULE_EXACT_ALARM covers Android 12.
      "android.permission.SCHEDULE_EXACT_ALARM",
      "android.permission.USE_EXACT_ALARM",
      "android.permission.CAMERA",
    ],
    // Removed in 2.0: not needed, or a Play-policy risk.
    blockedPermissions: [
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      // No voice notes (dropped 16.10) → no microphone.
      "android.permission.RECORD_AUDIO",
    ],
  },
  plugins: [
    // Runs LAST (mods run in reverse order): removes expo-notifications' Firebase
    // <meta-data> — that library is not in the Android build (package.json).
    "./plugins/without-notifications-metadata",
    [
      "expo-splash-screen",
      { image: "./assets/v2/splash-icon.png", imageWidth: 120, resizeMode: "contain", backgroundColor: "#0E0F13" },
    ],
    "expo-system-ui",
    // Transparent system navigation bar: no white scrim over the tab bar (3-button nav, EMUI).
    ["expo-navigation-bar", { enforceContrast: false, style: "light" }],
    "expo-sqlite",
    "expo-font",
    // The 9 app languages: Android 13+ per-app language picker + iOS CFBundleLocalizations.
    // The plugin also adds "locale" to configChanges, so a language change does not restart the activity.
    ["expo-localization", { supportedLocales: ["en", "bg", "ru", "de", "fr", "tr", "es", "it", "ro"] }],
    "expo-background-task",
    [
      "expo-location",
      {
        locationWhenInUsePermission: "EasySpot saves where you parked and guides you back to your car.",
        isAndroidBackgroundLocationEnabled: false,
        isIosBackgroundLocationEnabled: false,
      },
    ],
    [
      "expo-notifications",
      { icon: "./assets/v2/notification-icon.png", color: "#C8F135" },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "EasySpot keeps a photo of where you parked (only on this phone) and reads the level, zone, spot and car plate from it, or the time from a parking ticket.",
        recordAudioAndroid: false,
        // No video / voice → no microphone permission on iPhone either.
        microphonePermission: false,
      },
    ],
    [
      "expo-sensors",
      { motionPermission: "EasySpot uses motion and air-pressure sensors to work out which garage level you parked on." },
    ],
    // Native parking reminder (AlarmManager) — replaces copying patches/ by hand.
    "./plugins/with-parking-module",
    // Lets Settings see / open the installed navigation apps (Android 11+ package visibility).
    "./plugins/with-map-queries",
    // Release build signed with the Play upload key from credentials.json (not in the repo).
    "./plugins/with-release-signing",
    // R8 in release builds (shrink + optimise + obfuscate) — Google Play requirement.
    "./plugins/with-r8",
  ],
  extra: {
    store: STORE,
    eas: { projectId: "a817f6ab-8aca-40af-bbb4-47369905f326" },
  },
};

export default config;
