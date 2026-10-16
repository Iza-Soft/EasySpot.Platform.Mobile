import AsyncStorage from "@react-native-async-storage/async-storage";
import { MapChoice, resolveMap } from "../constants/maps";
import { getPhoneMapsAsync } from "./map-apps";

const MAP_PREFERENCE_KEY = "@preferred_map";

/** What the user picked (Maps id or "app:<package>"), or null if never picked. */
export const getSavedMap = async (): Promise<MapChoice | null> => {
  try {
    return await AsyncStorage.getItem(MAP_PREFERENCE_KEY);
  } catch {
    return null;
  }
};

/**
 * The map to use now: the saved one if it is still installed, otherwise the
 * phone's main map (saved, so Settings shows the same).
 */
export const getPreferredMap = async (): Promise<MapChoice> => {
  const saved = await getSavedMap();
  const { apps, isHuawei } = await getPhoneMapsAsync();
  const map = resolveMap(saved, apps, isHuawei);
  if (saved && map !== saved) await setPreferredMap(map).catch(() => {});
  return map;
};

export const setPreferredMap = async (map: MapChoice): Promise<void> => {
  await AsyncStorage.setItem(MAP_PREFERENCE_KEY, map);
};
