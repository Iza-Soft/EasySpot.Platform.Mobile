import { StyleSheet, View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../themes/main";
import { SLIDE_ITEMS } from "../../constants/slides";
import { SlideCardComponent } from "../../components/SlideCardComponent";
import {
  getLastSavedLocationAsync,
  saveLocationAsync,
} from "../../services/location-service";
import { useSQLiteContext } from "expo-sqlite";
import LoadingComponent from "../../components/LoadingComponent";
import { useState } from "react";
import {
  openMapsAsync,
  ShareLocationAsync,
} from "../../services/navigation-service";
import { Maps } from "../../constants/maps";
import { LocationData } from "../../types/common";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import ModalComponent from "../../components/modal/ModalComponent";
import LocationDetailsComponent from "../../components/modal/LocationDetailsComponent";

export type LocationDetails = {
  id?: string;
  title: string;
  level?: string;
  section?: string;
  spot?: string;
  comments?: string;
};

export default function MainScreenComponent({ navigation }: any) {
  const database = useSQLiteContext();
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [action, setAction] = useState<undefined | string>();

  const handleSaveLocation = async (data: LocationDetails) => {
    setModalVisible(false);
    setLoading(true);

    (async () => {
      await saveLocationAsync({
        database,
        action: action,
        title: data.title?.trim(),
        level: data.level?.trim(),
        section: data.section?.trim(),
        spot: data.spot?.trim(),
        comments: data.comments?.trim(),
        onSuccess: () => {
          setLoading(false);
          Toast.show({
            type: "success",
            text1: "Success",
            text2:
              action === "favorites"
                ? "Favorite location saved successfully."
                : "Parking location saved successfully.",
          });
        },
        onError: (message) => {
          setLoading(false);
          console.error("❌ Failed to save location:", message);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to save location.",
          });
        },
      });
    })();
  };

  const onPress = (action: string) => {
    if (["parking", "favorites"].includes(action)) {
      setAction(action);
      setModalVisible(true);
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
              Toast.show({
                type: "info",
                text1: "Info",
                text2: "No saved locations found.",
              });
            }
          },
          onError: (message) => {
            console.error("❌ Failed to retrieve location:", message);
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to retrieve the saved location.",
            });
          },
        });
      })();
    } else if (action === "history") {
      navigation.navigate("History");
    } else if (action === "share") {
      (async () => {
        try {
          // Ask for permission
          const { status } = await Location.requestForegroundPermissionsAsync();
          setLoading(true);
          if (status !== "granted") {
            setLoading(false);
            Toast.show({
              type: "info",
              text1: "Info",
              text2:
                "Location permission not granted. Please enable it in settings.",
            });
            return;
          }

          await ShareLocationAsync(Maps.google);
        } catch (err) {
          console.error("❌ Share current location failed:", err);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to share your current location.",
          });
        } finally {
          setLoading(false);
        }
      })();
    } else {
      Toast.show({
        type: "info",
        text1: "Info",
        text2: "This feature is coming soon!",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={SLIDE_ITEMS}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <SlideCardComponent item={item} onPress={onPress} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {loading && <LoadingComponent message="Saving your spot…" />}

      <ModalComponent
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <LocationDetailsComponent
          mode="edit"
          action={action}
          initialData={{
            title: "",
            level: "",
            section: "",
            spot: "",
            comments: "",
          }}
          onSubmit={(data) => {
            handleSaveLocation(data);
            setModalVisible(false);
          }}
        />
      </ModalComponent>
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
