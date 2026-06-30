import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, StyleSheet } from "react-native";
import MainScreenComponent from "../screens/main/MainScreen";
import FooterComponent from "./FooterComponent";
import HistoryScreenComponent from "../screens/history/HistoryScreen";
import { useEffect, useState } from "react";
import SettingsComponent from "./SettingsComponent";
import ModalComponent from "./modal/ModalComponent";
import PrivacyPolicyScreenComponent from "../screens/legal/PrivacyPolicyScreen";
import TermsOfServiceScreenComponent from "../screens/legal/TermsOfServiceScreen";
import AboutScreenComponent from "../screens/about/AboutScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BatteryOptimizationScreenComponent from "../screens/battery/BatteryOptimizationScreen";
import { useBatteryBannerLogic } from "../hook/useBatteryBannerLogic";
import MapProviderComponent from "./modal/MapProviderComponent";

const Stack = createNativeStackNavigator();

const NavigatorComponent = ({ navigation }: any) => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsMode, setDetailsMode] = useState<
    "privacy" | "terms" | "about" | "battery" | "map_provider"
  >("privacy");

  const [policyRequired, setPolicyRequired] = useState(false);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);
  const PRIVACY_VERSION = "1.0.0";

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

  const { handleInstructionsOpened } = useBatteryBannerLogic();

  return (
    <NavigationContainer>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          options={{
            headerShown: false,
          }}
        >
          {(props) => (
            <MainScreenComponent
              {...props}
              onMenuPress={() => setSettingsVisible(true)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="History"
          options={{
            headerShown: false,
          }}
        >
          {(props) => (
            <HistoryScreenComponent
              {...props}
              onMenuPress={() => setSettingsVisible(true)}
            />
          )}
        </Stack.Screen>
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
        onBatteryOptimizationView={async () => {
          setModalVisible(true);
          setDetailsMode("battery");
          handleInstructionsOpened();
        }}
        onMapProviderView={() => {
          setModalVisible(true);
          setDetailsMode("map_provider");
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
        {detailsMode === "battery" && <BatteryOptimizationScreenComponent />}
        {detailsMode === "map_provider" && <MapProviderComponent />}
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
    borderRadius: 0,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007BFF",
  },
});
