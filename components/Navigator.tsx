import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, StyleSheet } from "react-native";
import MainScreenComponent from "../screens/main/MainScreen";
import FooterComponent from "./Footer";
import HistoryScreenComponent from "../screens/history/HistoryScreen";

const Stack = createNativeStackNavigator();

const NavigatorComponent = () => {
  return (
    <NavigationContainer>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainScreenComponent} />
        <Stack.Screen name="History" component={HistoryScreenComponent} />
      </Stack.Navigator>
      <FooterComponent />
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
