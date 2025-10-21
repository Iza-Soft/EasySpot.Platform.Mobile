import { SQLiteProvider } from "expo-sqlite";
import {
  createDBifNeeded,
  DB_NAME,
  openPersistentDB,
} from "./services/db-service";
import NavigatorComponent from "./components/Navigator";
import { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { colors } from "./themes/main";
import Toast from "react-native-toast-message";
import { toastConfigComponent } from "./components/toastConfig";
import * as Notifications from "expo-notifications";
import { setupNotifications } from "./config/notifications-config";

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // Animation values
  const logoY = useRef(new Animated.Value(-200)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const gearRotation = useRef(new Animated.Value(0)).current;
  const initializingOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Splash animation
    Animated.sequence([
      Animated.timing(logoY, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() =>
      (async () => {
        try {
          // Start gear rotation indefinitely
          Animated.loop(
            Animated.timing(gearRotation, {
              toValue: 1,
              duration: 1600,
              easing: Easing.linear,
              useNativeDriver: true,
            })
          ).start();

          const timer = setTimeout(async () => {
            setIsReady(true); // wait before starting DB init animation for 3 seconds
          }, 300);

          // this should be uncommented in production - TODO
          // await openPersistentDB(); // just ensures persistence setup
          // setIsReady(false);
          // setIsSplashVisible(false);
          // this should be uncommented in production -TODO

          // simulate longer init for demo - this should be removed in production - TODO
          const new_timer = setTimeout(async () => {
            try {
              //throw new Error("Database initialization timeout!"); //- simulate error
              await openPersistentDB(); // just ensures persistence setup
              setIsReady(false);
              setIsSplashVisible(false);
            } catch (error) {
              setDbError(true);
              setIsReady(false);
            }
          }, 3000);
          // simulate longer init for demo - TODO

          return () => clearTimeout(timer);
        } catch (error) {
          console.error("❌ Database open failed:", error);
          setDbError(true);
          setIsReady(false);
        }
      })()
    );

    setupNotifications(); // 👈 runs once to configure everything
  }, []);

  const spin = gearRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (isSplashVisible) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="dark-content"
          translucent
          backgroundColor="transparent"
        />
        <Animated.Image
          source={require("./assets/easyspot-logo.png")}
          style={[styles.logo, { transform: [{ translateY: logoY }] }]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
          Easy Spot
        </Animated.Text>

        {isReady && (
          <Animated.View
            style={[styles.initRow, { opacity: initializingOpacity }]}
          >
            <Text style={styles.initializingText}>Getting ready...</Text>
            <Animated.Text
              style={[styles.gear, { transform: [{ rotate: spin }] }]}
            >
              ⚙️
            </Animated.Text>
          </Animated.View>
        )}
        {dbError && (
          <Text style={styles.errorText}>
            Easy Spot hit a small bump! Try reopening the app 🚧
          </Text>
        )}
      </View>
    );
  }

  return (
    <>
      <SQLiteProvider databaseName={DB_NAME} onInit={createDBifNeeded}>
        <NavigatorComponent />
      </SQLiteProvider>
      <Toast
        config={toastConfigComponent}
        position="bottom"
        visibilityTime={3000}
        bottomOffset={80}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F3F6FA", // Light gray background
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36, // larger text
    fontWeight: "900", // maximum boldness
    color: colors.tab, // keep your theme color
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 3 },
    textShadowRadius: 6,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    position: "absolute",
    bottom: 80, // distance from bottom of screen
  },
  initRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 80, // distance from bottom of screen
  },
  initializingText: {
    fontSize: 16,
    color: colors.muted,
    marginRight: 6,
    fontWeight: "600",
  },
  gear: {
    fontSize: 22,
  },
});
