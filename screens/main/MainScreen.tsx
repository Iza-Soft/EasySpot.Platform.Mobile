import { StyleSheet, View, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../themes/main";
import { SLIDE_ITEMS } from "../../constants/slides";
import { SlideCard } from "../../components/SlideCard";
import {
  getLastSavedLocationAsync,
  saveLocationAsync,
} from "../../services/location-service";
import { useSQLiteContext } from "expo-sqlite";
import Loading from "../../components/Loading";
import { useState } from "react";
import {
  openMapsAsync,
  ShareLocationAsync,
} from "../../services/navigation-service";
import { Maps } from "../../constants/maps";
import { LocationData } from "../../types/common";
import * as Location from "expo-location";

export default function MainScreenComponent({ navigation }: any) {
  const database = useSQLiteContext();
  const [loading, setLoading] = useState(false);

  const onPress = (action: string) => {
    if (action === "parking") {
      setLoading(true);
      (async () => {
        await saveLocationAsync({
          database,
          action,
          onSuccess: () => {
            setLoading(false);
            Alert.alert("Success", "Parking location saved successfully.");
          },
          onError: (message) => {
            setLoading(false);
            Alert.alert("Error", message);
          },
        });
      })();
    } else if (action === "navigate") {
      (async () => {
        await getLastSavedLocationAsync({
          database,
          onSuccess: async (location) => {
            if (location) {
              await openMapsAsync({
                latitude: (location as LocationData).latitude,
                longitude: (location as LocationData).longitude,
                map: Maps.google,
              });
            } else {
              Alert.alert(
                "No saved locations",
                "Add a location to get started."
              );
            }
          },
          onError: (message) => {
            Alert.alert("Error", message);
          },
        });
      })();
    } else if (action === "history") {
      navigation.navigate("History");
    } else if (action === "favorites") {
      setLoading(true);
      (async () => {
        await saveLocationAsync({
          database,
          action,
          onSuccess: () => {
            setLoading(false);
            Alert.alert("Success", "Favorite location saved successfully.");
          },
          onError: (message) => {
            setLoading(false);
            Alert.alert("Error", message);
          },
        });
      })();
      // Alert.alert("Feature not implemented", "Favorites is coming soon!");
    } else if (action === "share") {
      (async () => {
        try {
          // Ask for permission
          const { status } = await Location.requestForegroundPermissionsAsync();
          setLoading(true);
          if (status !== "granted") {
            setLoading(false);
            Alert.alert(
              "Error",
              "Location permission not granted. Please enable it in settings."
            );
            return;
          }

          await ShareLocationAsync(Maps.google);
        } catch (err) {
          console.error("❌ Share current location failed:", err);
          Alert.alert("Error", "Failed to share your current location.");
        } finally {
          setLoading(false);
        }
      })();
    } else {
      Alert.alert("Feature not implemented", "This feature is coming soon!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={SLIDE_ITEMS}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <SlideCard item={item} onPress={onPress} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {loading && <Loading message="Saving your spot…" />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    marginTop: -30,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
