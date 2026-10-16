import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { RootStackParamList } from "../../navigation/types";
import { ReadyView } from "./ReadyView";

/**
 * First tab: always Home (where you are + PARK). After Save the user comes
 * back here with a toast; active parkings live in Spots (Parked screen).
 */
export default function ParkScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <ReadyView navigation={navigation} />;
}
