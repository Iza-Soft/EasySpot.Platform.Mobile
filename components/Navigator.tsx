import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, StyleSheet, Image, View, Text } from "react-native";
import MainScreenComponent from "../screens/main/MainScreen";
import FooterComponent from "./Footer";
import HistoryScreenComponent from "../screens/history/HistoryScreen";
import { colors } from "../themes/main";

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
                  v1.0.0
                </Text>
              </View>
            ),
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
                  v1.0.0
                </Text>
              </View>
            ),
            headerLeft: () => null, // <-- removes the back button
            headerBackVisible: false, // hides back button
          }}
        />
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
