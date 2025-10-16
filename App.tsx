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
  Image,
  StyleSheet,
  Text,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { colors } from "./themes/main";

export default function App() {
  const [db, setDb] = useState<any>(null);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // Animation values
  const logoY = useRef(new Animated.Value(-200)).current; // logo starts above screen
  const textOpacity = useRef(new Animated.Value(0)).current; // text starts invisible

  useEffect(() => {
    (async () => {
      const database = await openPersistentDB();
      setDb(database);
    })();

    // Animate logo drop + text fade in
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
    ]).start();

    // Force splash for 30 seconds
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 6000); // 6,000 ms = 6 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!db || isSplashVisible) {
    return (
      // <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      //   <ActivityIndicator size="large" />
      // </View>
      // <View style={styles.loadingContainer}>
      //   <Image
      //     source={require("./assets/easyspot-logo.png")}
      //     style={styles.logo}
      //     resizeMode="contain"
      //   />
      //   <Text style={styles.appName}>Easy Spot</Text>
      // </View>
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <Animated.Image
          source={require("./assets/easyspot-logo.png")}
          style={[styles.logo, { transform: [{ translateY: logoY }] }]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
          Easy Spot
        </Animated.Text>
      </View>
    );
  }

  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={createDBifNeeded}>
      <NavigatorComponent />
    </SQLiteProvider>
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
});
