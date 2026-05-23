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
import { useCallback, useState, useRef, useEffect } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import BatteryOptimizationBannerComponent from "../../components/BatteryOptimizationBannerComponent";
import BatteryOptimizationScreenComponent from "../battery/BatteryOptimizationScreen";
import { useBatteryBannerLogic } from "../../hook/useBatteryBannerLogic";
import ParkingNativeService from "../../native/ParkingModule";
import { setupSchedulerAsync } from "../../services/scheduler-service";
import { REMINDER_CONFIG } from "../../config/reminder.config";

export type LocationDetails = {
  id?: string;
  title: string;
  level?: string;
  section?: string;
  spot?: string;
  comments?: string;
  timerEnabled?: boolean;
};

export default function MainScreenComponent({ navigation }: any) {
  const database = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [batteryModalVisible, setBatteryModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [action, setAction] = useState<undefined | string>();

  const [hasSavedLocation, setHasSavedLocation] = useState(false);

  const listRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      const checkLocation = async () => {
        await getLastSavedLocationAsync({
          database,
          onSuccess: (location) => {
            setHasSavedLocation(!!location);
          },
          onError: () => {
            setHasSavedLocation(false);
          },
        });
      };

      checkLocation();
    }, [database]),
  );

  useEffect(() => {
    const initNative = async () => {
      await ParkingNativeService.initialize();
    };
    initNative();
  }, []);

  const slides = SLIDE_ITEMS.map((item) =>
    item.action === "navigate"
      ? { ...item, disabled: !hasSavedLocation }
      : item,
  );

  const navigateIndex = slides.findIndex((item) => item.action === "navigate");

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
        onSuccess: async () => {
          setLoading(false);
          setHasSavedLocation(true);

          let scheduled = false;

          if (action === "parking" && data.timerEnabled) {
            scheduled = await handleParkingTimer(data);
          }

          Toast.show({
            type: "success",
            text1: "Success",
            text2:
              action === "favorites"
                ? "Favorite location saved successfully."
                : scheduled
                  ? `You'll be notified ${REMINDER_CONFIG.DEFAULT_NOTIFY_BEFORE_MINUTES} minutes before your parking expires.`
                  : "Parking location saved successfully.",
          });

          setTimeout(() => {
            if (navigateIndex >= 0) {
              listRef.current?.scrollToIndex({
                index: navigateIndex,
                animated: true,
                viewPosition: 0.5, // centers card nicely
              });
            }
          }, 400);
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

  const handleParkingTimer = async (
    data: LocationDetails,
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      getLastSavedLocationAsync({
        database,
        onSuccess: async (location) => {
          if (location) {
            try {
              const scheduled = await setupSchedulerAsync({
                database: database,
                locationId: (location as LocationData).id,
                title: data.title?.trim() || "Parking spot",
                durationMinutes: REMINDER_CONFIG.DEFAULT_DURATION_MINUTES,
                notifyBeforeMinutes:
                  REMINDER_CONFIG.DEFAULT_NOTIFY_BEFORE_MINUTES,
              });
              resolve(scheduled);
            } catch (error) {
              reject(error);
            }
          } else {
            resolve(false);
          }
        },
        onError: (message) => {
          console.error("Failed to get last location:", message);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to retrieve the saved location.",
          });
          reject(new Error(message));
        },
      });
    });
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
            if (!location) {
              Toast.show({
                type: "info",
                text1: "Info",
                text2: "No saved locations found.",
              });
              return;
            }

            await openMapsAsync({
              latitude: (location as LocationData).latitude,
              longitude: (location as LocationData).longitude,
              map: Maps.google,
            });
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

  const {
    shouldShowBanner,
    deviceInfo,
    handleDismiss,
    handleInstructionsOpened,
  } = useBatteryBannerLogic();

  const handleInstructionsPress = () => {
    handleInstructionsOpened();
    setBatteryModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {shouldShowBanner && deviceInfo && (
        <BatteryOptimizationBannerComponent
          deviceInfo={deviceInfo}
          onInstructionsPress={handleInstructionsPress}
          onDismiss={handleDismiss}
        />
      )}
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <SlideCardComponent item={item} onPress={onPress} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        // 👇 IMPORTANT — avoid scroll crash
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 300);
        }}
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

      <ModalComponent
        visible={batteryModalVisible}
        onClose={() => setBatteryModalVisible(false)}
      >
        <BatteryOptimizationScreenComponent />
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
