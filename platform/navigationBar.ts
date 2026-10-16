import { requireOptionalNativeModule } from "expo-modules-core";
import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Android system navigation bar button colour, following the app theme.
 *
 * The bar itself is made transparent at build time by the expo-navigation-bar
 * plugin (enforceContrast: false). We call the native module directly instead
 * of the <NavigationBar> component: the component also calls setHidden() on
 * every update without catching errors, which surfaces as
 * "Call to function 'ExpoNavigationBar.setHidden' has been rejected — the
 * current activity is no longer available" during reloads / backgrounding.
 */
const native =
  Platform.OS === "android"
    ? requireOptionalNativeModule<{ setStyle(style: "light" | "dark"): Promise<void> }>("ExpoNavigationBar")
    : null;

/** buttons: "light" = light buttons (dark theme), "dark" = dark buttons (light theme). */
export function useNavigationBarButtons(buttons: "light" | "dark") {
  useEffect(() => {
    native?.setStyle(buttons).catch(() => {
      // Activity not available (reload, app in background) — the next theme change or launch sets it again.
    });
  }, [buttons]);
}
