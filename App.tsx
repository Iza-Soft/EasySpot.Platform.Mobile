import "intl-pluralrules";
import i18n from "./i18n";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLanguageSync } from "./hook/useLanguageSync";
import { loadPrefs } from "./state/prefs";
import RootNavigator from "./navigation/RootNavigator";
import ParkingNativeService from "./native/ParkingModule";
import { createDBifNeeded, DB_NAME, openPersistentDB } from "./services/db-service";
import { resyncReminders } from "./services/spots-service";
import { watchIosReminders } from "./services/reminder-log";
import { IosNotifications } from "./platform/ios-only";
import { appFonts } from "./theme/fonts";
import { ThemeProvider } from "./theme/ThemeProvider";
import { palette } from "./theme/tokens";
import { Logo, Text } from "./ui";
import { ThemedToast } from "./ui/toast";

// Keep the native splash (dark + Bay icon) up until fonts and the DB are ready.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

// iPhone: show the reminder (and the test one) as a banner even while EasySpot is open.
// Android reminders do not go through expo-notifications (ParkingReceiver.kt).
IosNotifications?.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** DB ready → bring back every reminder that is still ahead (restart / update / 1.x safety net). */
async function initDb(db: Parameters<typeof createDBifNeeded>[0]) {
  await createDBifNeeded(db);
  resyncReminders(db, i18n.t("v2.parked.title")).catch((e) => console.warn("reminder resync failed:", e));
}

export default function App() {
  // Texts follow the phone's language live (no restart).
  useLanguageSync();
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const [dbState, setDbState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    openPersistentDB()
      .then(() => setDbState("ready"))
      .catch((e) => {
        console.error("❌ Database open failed:", e);
        setDbState("error");
      });
    loadPrefs();
    // Creates the Android notification channel for parking reminders.
    ParkingNativeService.initialize();
    // iPhone: note reminders that arrive while the app is open / are tapped (history, Reminders screen).
    return watchIosReminders();
  }, []);

  const ready = (fontsLoaded || !!fontError) && dbState !== "loading";

  // The splash is hidden by RootNavigator once Home or the privacy screen is up
  // (no blank frame, no Home flash). Only the DB-error screen hides it here.
  useEffect(() => {
    if (ready && dbState === "error") SplashScreen.hideAsync().catch(() => undefined);
  }, [ready, dbState]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {dbState === "error" ? (
          <DbError />
        ) : (
          <SQLiteProvider databaseName={DB_NAME} onInit={initDb}>
            <RootNavigator />
          </SQLiteProvider>
        )}
        <ThemedToast />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function DbError() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
      <Logo size={64} />
      <Text variant="body" tone="alert" style={{ textAlign: "center" }}>{t("app.db_error")}</Text>
    </View>
  );
}
