import AsyncStorage from "@react-native-async-storage/async-storage";
import { Maps } from "../constants/maps";

const MAP_PREFERENCE_KEY = "@preferred_map";

export const getPreferredMap = async (): Promise<Maps> => {
  try {
    const saved = await AsyncStorage.getItem(MAP_PREFERENCE_KEY);
    return (saved as Maps) ?? Maps.google;
  } catch {
    return Maps.google;
  }
};

export const setPreferredMap = async (map: Maps): Promise<void> => {
  await AsyncStorage.setItem(MAP_PREFERENCE_KEY, map);
};
