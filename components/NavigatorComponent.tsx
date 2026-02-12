import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  StatusBar,
  StyleSheet,
  Image,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import MainScreenComponent from "../screens/main/MainScreen";
import FooterComponent from "./FooterComponent";
import HistoryScreenComponent from "../screens/history/HistoryScreen";
import { colors } from "../themes/main";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import SettingsComponent from "./SettingsComponent";
import ModalComponent from "./modal/ModalComponent";
import PrivacyPolicyScreenComponent from "../screens/legal/PrivacyPolicyScreen";
import TermsOfServiceScreenComponent from "../screens/legal/TermsOfServiceScreen";
import AboutScreenComponent from "../screens/about/AboutScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const Stack = createNativeStackNavigator();

const NavigatorComponent = ({ navigation }: any) => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsMode, setDetailsMode] = useState<"privacy" | "terms" | "about">(
    "privacy",
  );

  const [policyRequired, setPolicyRequired] = useState(false);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);
  const PRIVACY_VERSION = "1.0.0";
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  useEffect(() => {
    const checkPrivacyPolicy = async () => {
      try {
        const acceptedVersion = await AsyncStorage.getItem(
          "privacyAcceptedVersion",
        );

        if (acceptedVersion !== PRIVACY_VERSION) {
          setPolicyRequired(true);
          setModalVisible(true);
          setDetailsMode("privacy");
        }
      } catch (error) {
        console.log("Error checking privacy version:", error);
      }
    };

    checkPrivacyPolicy();
  }, []);

  // ✅ Handle modal close
  const handleCloseModal = async () => {
    // If privacy is required
    if (policyRequired) {
      if (!isPrivacyChecked) return; // block closing

      // Save version if accepted
      await AsyncStorage.setItem("privacyAcceptedVersion", PRIVACY_VERSION);

      setPolicyRequired(false);
      setIsPrivacyChecked(false);
    }

    setModalVisible(false);
  };

  const HeaderMenuButton = ({ navigation }: any) => (
    <TouchableOpacity
      onPress={() => setSettingsVisible(true)}
      style={{ marginRight: 15 }}
    >
      <Ionicons name="menu" size={28} color={colors.tab} />
    </TouchableOpacity>
  );

  return (
    <NavigationContainer>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={MainScreenComponent}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={require("../assets/easyspot-logo.png")}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain" // or 'cover', 'stretch'
                />
                <Text
                  style={{
                    fontSize: 20,
                    color: colors.tab,
                    fontWeight: "900",
                    marginBottom: 10,
                    marginLeft: -6,
                  }}
                >
                  asy spot
                </Text>
                <Text
                  style={{ fontSize: 12, color: colors.muted, marginLeft: 15 }}
                >
                  v{appVersion}
                </Text>
              </View>
            ),
            headerRight: () => <HeaderMenuButton navigation={navigation} />,
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreenComponent}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={require("../assets/easyspot-logo.png")}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain" // or 'cover', 'stretch'
                />
                <Text
                  style={{
                    fontSize: 20,
                    color: colors.tab,
                    fontWeight: "900",
                    marginBottom: 10,
                    marginLeft: -6,
                  }}
                >
                  asy spot
                </Text>
                <Text
                  style={{ fontSize: 12, color: colors.muted, marginLeft: 15 }}
                >
                  v{appVersion}
                </Text>
              </View>
            ),
            headerLeft: () => null, // <-- removes the back button
            headerBackVisible: false, // hides back button
            headerRight: () => <HeaderMenuButton navigation={navigation} />,
          }}
        />
      </Stack.Navigator>
      <FooterComponent />
      <SettingsComponent
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onPrivacyView={() => {
          setModalVisible(true);
          setDetailsMode("privacy");
        }}
        onTermsView={() => {
          setModalVisible(true);
          setDetailsMode("terms");
        }}
        onAboutView={() => {
          setModalVisible(true);
          setDetailsMode("about");
        }}
      />

      <ModalComponent
        visible={modalVisible}
        canClose={!policyRequired || isPrivacyChecked}
        onClose={handleCloseModal}
      >
        {detailsMode === "privacy" && (
          <PrivacyPolicyScreenComponent
            required={policyRequired}
            isChecked={isPrivacyChecked}
            setIsChecked={setIsPrivacyChecked}
          />
        )}
        {detailsMode === "terms" && <TermsOfServiceScreenComponent />}
        {detailsMode === "about" && <AboutScreenComponent />}
      </ModalComponent>
    </NavigationContainer>
  );
};

export default NavigatorComponent;

const styles = StyleSheet.create({
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 98,
    height: 30,
    marginRight: 8,
    borderRadius: 0, // matches your icon style
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007BFF", // ParkMate blue
  },
});
