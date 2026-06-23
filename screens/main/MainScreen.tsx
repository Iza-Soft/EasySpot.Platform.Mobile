import { StyleSheet, View, FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../themes/main";
import { useSlideItems } from "../../hook/slides";
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
import { useTranslation } from "react-i18next";
import { Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { typography } from "../../themes/typography";

export type LocationDetails = {
  id?: string;
  title: string;
  level?: string;
  section?: string;
  spot?: string;
  comments?: string;
  timerEnabled?: boolean;
};

export default function MainScreenComponent({ navigation, onMenuPress }: any) {
  const database = useSQLiteContext();
  const { t: localize } = useTranslation();
  const SLIDE_ITEMS = useSlideItems();
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
            text1: localize("common.success"),
            text2:
              action === "favorites"
                ? localize("main.success.favorite_saved")
                : scheduled
                  ? localize("main.success.parking_with_reminder", {
                      minutes: REMINDER_CONFIG.DEFAULT_NOTIFY_BEFORE_MINUTES,
                    })
                  : localize("main.success.parking_saved"),
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
            text1: localize("common.error"),
            text2: localize("main.errors.save_failed"),
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
            text1: localize("common.error"),
            text2: localize("main.errors.retrieve_failed"),
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
                text1: localize("common.info"),
                text2: localize("main.no_saved_locations"),
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
              text1: localize("common.error"),
              text2: localize("main.errors.retrieve_failed"),
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
              text1: localize("common.info"),
              text2: localize("main.location_permission_denied"),
            });
            return;
          }

          await ShareLocationAsync(Maps.google);
        } catch (err) {
          console.error("❌ Share current location failed:", err);
          Toast.show({
            type: "error",
            text1: localize("common.error"),
            text2: localize("main.errors.share_failed"),
          });
        } finally {
          setLoading(false);
        }
      })();
    } else {
      Toast.show({
        type: "info",
        text1: localize("common.info"),
        text2: localize("common.coming_soon"),
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.logoRow}>
            <View style={styles.logoIconWrapper}>
              <Image
                source={require("../../assets/easyspot-logo.png")}
                style={styles.logoIcon}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.logoText}>easy spot</Text>
              <Text style={styles.logoSub}>{localize("about.tagline")}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
            <Ionicons name="menu" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

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
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const isLastOdd =
            slides.length % 2 !== 0 && index === slides.length - 1;
          if (isLastOdd) {
            return (
              <View style={{ flex: 1 }}>
                <SlideCardComponent item={item} onPress={onPress} isFullWidth />
              </View>
            );
          }
          return <SlideCardComponent item={item} onPress={onPress} />;
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 300);
        }}
      />

      {loading && <LoadingComponent message={localize("main.saving")} />}

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
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.tab,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  heroInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  logoIconWrapper: {
    width: 34,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    width: 26,
    height: 26,
    tintColor: "white",
  },
  logoText: typography.heroTitle,
  logoSub: typography.heroSub,
  menuBtn: {
    width: 34,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    padding: 14,
    gap: 10,
  },

  row: {
    gap: 10,
  },
});
