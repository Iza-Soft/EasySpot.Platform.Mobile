import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import ParkScreen from "../screens/park/ParkScreen";
import { PrivacyConsent } from "../screens/legal/PrivacyConsent";
import ParkedScreen from "../screens/parked/ParkedScreen";
import SaveSpotScreen from "../screens/save/SaveSpotScreen";
import SpotDetailsScreen from "../screens/spots/SpotDetailsScreen";
import AboutScreen from "../screens/info/AboutScreen";
import LanguageScreen from "../screens/info/LanguageScreen";
import RemindersScreen from "../screens/reminders/RemindersScreen";
import PrivacyScreen from "../screens/info/PrivacyScreen";
import TermsScreen from "../screens/info/TermsScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import SpotsScreen from "../screens/spots/SpotsScreen";
import { useNavigationBarButtons } from "../platform/navigationBar";
import { useTheme } from "../theme/ThemeProvider";
import { linking } from "./linking";
import { TabBar } from "./TabBar";
import { RootStackParamList, TabParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/** Bump to show the privacy policy again after it changes (same key as 1.x). 2.0: new text (phone services, reminders). */
const PRIVACY_VERSION = "2.0.0";

function Tabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Park" component={ParkScreen} />
      <Tab.Screen name="Spots" component={SpotsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

/**
 * Start order: splash (logo) → privacy, if not yet accepted → Home.
 * Nothing of the app is rendered until we know whether the policy was
 * accepted, so Home never flashes before the privacy screen. The splash is
 * hidden only when the first real screen is on screen.
 */
export default function RootNavigator() {
  const { name, colors } = useTheme();
  /** null = still reading AsyncStorage (the splash stays up). */
  const [policyRequired, setPolicyRequired] = useState<boolean | null>(null);
  // Transparent Android nav bar (set at build time); light buttons on the dark theme.
  useNavigationBarButtons(name === "dark" ? "light" : "dark");

  useEffect(() => {
    AsyncStorage.getItem("privacyAcceptedVersion")
      .then((v) => setPolicyRequired(v !== PRIVACY_VERSION))
      .catch(() => setPolicyRequired(true));
  }, []);

  // The privacy screen is the first thing shown: drop the splash once it is there.
  useEffect(() => {
    if (policyRequired) SplashScreen.hideAsync().catch(() => undefined);
  }, [policyRequired]);

  const acceptPolicy = async () => {
    await AsyncStorage.setItem("privacyAcceptedVersion", PRIVACY_VERSION).catch(() => undefined);
    setPolicyRequired(false);
  };

  const navTheme: Theme = useMemo(() => {
    const base = name === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accentFg,
        background: colors.background,
        card: colors.navBar,
        text: colors.text,
        border: colors.border,
        notification: colors.alert,
      },
    };
  }, [name, colors]);

  if (policyRequired === null) return null; // splash still visible
  if (policyRequired) {
    return (
      <>
        <StatusBar style="light" />
        <PrivacyConsent onAccept={acceptPolicy} />
      </>
    );
  }

  return (
    <NavigationContainer linking={linking} theme={navTheme} onReady={() => SplashScreen.hideAsync().catch(() => undefined)}>
      <StatusBar style={name === "dark" ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Parked" component={ParkedScreen} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="SpotDetails" component={SpotDetailsScreen} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="Language" component={LanguageScreen} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="Reminders" component={RemindersScreen} options={{ animation: "slide_from_right" }} />
        <Stack.Screen
          name="SaveSpot"
          component={SaveSpotScreen}
          options={{ presentation: "transparentModal", animation: "slide_from_bottom" }}
        />
      </Stack.Navigator>

    </NavigationContainer>
  );
}
