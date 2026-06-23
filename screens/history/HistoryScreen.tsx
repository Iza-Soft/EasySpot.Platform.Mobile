import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
} from "react-native";
import { colors } from "../../themes/main";
import { useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import LoadingComponent from "../../components/LoadingComponent";
import {
  openMapsAsync,
  ShareLocationAsync,
} from "../../services/navigation-service";
import { Maps } from "../../constants/maps";
import LocationCard from "../../components/LocationCard";
import { CardItem } from "../../types/common";
import EmptyComponent from "../../components/EmptyComponent";
import {
  deleteAllLocationAsync,
  deleteLocationAsync,
  getAllSavedLocationAsync,
  updateLocationAsync,
} from "../../services/location-service";
import Toast from "react-native-toast-message";
import ModalComponent from "../../components/modal/ModalComponent";
import LocationCardOptionsComponent from "../../components/LocationCardOptionsComponent";
import LocationDetailsComponent, {
  LocationDetails,
} from "../../components/modal/LocationDetailsComponent";
import * as Clipboard from "expo-clipboard";
import { formatAddress } from "../../utils/address";
import {
  cancelSchedulerAsync,
  hasSchedulerAsync,
  rescheduleReminderAsync,
} from "../../services/scheduler-service";
import AdjustParkTimeComponent from "../../components/modal/AdjustParkTimeComponent";
import { REMINDER_CONFIG } from "../../config/reminder.config";
import { useTranslation } from "react-i18next";
import { TABS_CONFIG } from "../../config/tabs.config";
import { Ionicons } from "@expo/vector-icons";

export default function HistoryScreenComponent({
  navigation,
  onMenuPress,
}: any) {
  const { t: localize } = useTranslation();
  const database = useSQLiteContext();
  const [locations, setLocations] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    | typeof TABS_CONFIG.ALL
    | typeof TABS_CONFIG.FAVORITES
    | typeof TABS_CONFIG.PARKING
  >(TABS_CONFIG.ALL);
  const [searchText, setSearchText] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsMode, setDetailsMode] = useState<"edit" | "view" | "update">(
    "view",
  );
  const [parkTimeMode, setParkTimeMode] = useState<"adjust">();
  const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);
  const [loadingMessage, setLoadingMessage] =
    useState<string>("Loading history…");

  const PAGE_SIZE = 20;
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [cardOptionsVisible, setCardOptionsVisible] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPage(0, true);
    Animated.timing(rotateAnim, {
      toValue: isMultiSelectMode ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [searchText, isMultiSelectMode]);

  const searchRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const toolbarRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-90deg", "0deg"],
  });

  const searchOpacity = rotateAnim.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0],
  });

  const toolbarOpacity = rotateAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
  });

  const loadPage = async (pageToLoad: number, reset = false) => {
    await getAllSavedLocationAsync({
      database,
      searchText,
      limit: PAGE_SIZE,
      offset: pageToLoad * PAGE_SIZE,
      onSuccess: async (results) => {
        setHasMore((results as CardItem[]).length === PAGE_SIZE);

        if (reset) {
          setLocations(results as CardItem[]);
        } else {
          setLocations((prev) => [...prev, ...(results as CardItem[])]);
        }

        setPage(pageToLoad);
        setLoading(false);
      },
      onError: (message) => {
        setLoading(false);
        console.error("❌ Failed to load history:", message);
      },
    });
  };

  const openInMaps = async (item?: CardItem | null) => {
    if (item) {
      await openMapsAsync({
        latitude: item.latitude,
        longitude: item.longitude,
        map: Maps.google,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to retrieve the saved location.",
      });
    }
  };

  const deleteLocation = async (id: number | undefined) => {
    if (!id) {
      Toast.show({
        type: "error",
        text1: localize("common.error"),
        text2: localize("history.errors.invalid_id"),
      });
      return;
    }

    Alert.alert(
      localize("history.delete_confirm_title"),
      localize("history.delete_confirm_message"),
      [
        { text: localize("common.cancel"), style: "cancel" },
        {
          text: localize("common.delete"),
          style: "destructive",
          onPress: async () => {
            setCardOptionsVisible(false);
            setLoadingMessage(localize("history.deleting_location"));
            setLoading(true);

            try {
              // First, check if there is an active reminder
              let hasActiveReminder = false;

              await hasSchedulerAsync({
                locationId: id,
                onSuccess: (hasActive) => {
                  hasActiveReminder = hasActive;
                  console.log(`Location ${id} has active reminder:`, hasActive);
                },
                onError: (message) => {
                  console.error("Failed to check active reminder:", message);
                },
              });

              await deleteLocationAsync({
                database,
                id,
                onSuccess: async () => {
                  setLocations((prev) => prev.filter((l) => l.id !== id));

                  // Cancel a reminder only if there is an active one
                  if (hasActiveReminder) {
                    try {
                      await cancelSchedulerAsync({
                        locationId: id,
                        onSuccess: () => {
                          console.log("Reminder cancelled successfully");
                        },
                        onError: (message) => {
                          console.error("Error cancelling reminder:", message);
                        },
                      });
                    } catch (reminderError) {
                      console.error(
                        "Failed to cancel reminder:",
                        reminderError,
                      );
                    }
                  } else {
                    console.log(
                      `No active reminder found for location ${id}, skipping cancellation`,
                    );
                  }

                  Toast.show({
                    type: "success",
                    text1: localize("common.success"),
                    text2: localize("history.success.location_deleted"),
                  });
                },
                onError: (message) => {
                  throw new Error(message);
                },
              });
            } catch (error) {
              console.error("❌ Failed to delete location:", error);
              Toast.show({
                type: "error",
                text1: localize("common.error"),
                text2: localize("history.errors.delete_failed"),
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const deleteAllLocations = async () => {
    if (selectedLocations.length === 0) {
      Toast.show({
        type: "error",
        text1: localize("common.error"),
        text2: localize("history.errors.no_locations_selected"),
      });
      return;
    }

    Alert.alert(
      localize("history.delete_confirm_title"),
      localize("history.delete_all_confirm_message"),
      [
        { text: localize("common.cancel"), style: "cancel" },
        {
          text: localize("common.delete"),
          style: "destructive",
          onPress: async () => {
            setCardOptionsVisible(false);
            setLoadingMessage(localize("history.deleting_locations"));
            setLoading(true);

            try {
              // Parallel check of all reminders
              const checkPromises = selectedLocations.map(
                async (locationId) => {
                  const hasActive = await new Promise<boolean>((resolve) => {
                    hasSchedulerAsync({
                      locationId,
                      onSuccess: resolve,
                      onError: () => resolve(false),
                    });
                  });
                  return { locationId, hasActive };
                },
              );

              const reminderStatuses = await Promise.all(checkPromises);
              const activeRemindersMap = new Map(
                reminderStatuses.map(({ locationId, hasActive }) => [
                  locationId,
                  hasActive,
                ]),
              );

              const activeLocations = reminderStatuses
                .filter(({ hasActive }) => hasActive)
                .map(({ locationId }) => locationId);

              console.log(
                `Locations with active reminders: ${activeLocations.length}`,
              );

              // Delete locations
              await deleteAllLocationAsync({
                database,
                selectedLocations,
                onSuccess: async () => {
                  // Cancel reminders for active ones only
                  if (activeLocations.length > 0) {
                    const cancelPromises = activeLocations.map(
                      async (locationId) => {
                        try {
                          await cancelSchedulerAsync({
                            locationId,
                            onSuccess: () => {
                              console.log(
                                `Reminder cancelled for location ${locationId}`,
                              );
                            },
                            onError: (message) => {
                              console.warn(
                                `Failed to cancel reminder for location ${locationId}:`,
                                message,
                              );
                            },
                          });
                        } catch (reminderError) {
                          console.warn(
                            `Error cancelling reminder for location ${locationId}:`,
                            reminderError,
                          );
                        }
                      },
                    );

                    await Promise.allSettled(cancelPromises);
                  }

                  setLocations((prev) =>
                    prev.filter((l) => !selectedLocations.includes(l.id)),
                  );
                  setSelectedLocations([]);
                  setIsMultiSelectMode(false);
                  setLoading(false);

                  Toast.show({
                    type: "success",
                    text1: localize("common.success"),
                    text2: localize("history.success.locations_deleted", {
                      count: selectedLocations.length,
                    }),
                  });
                },
                onError: (message) => {
                  throw new Error(message);
                },
              });
            } catch (error) {
              console.error("❌ Failed to delete locations:", error);
              Toast.show({
                type: "error",
                text1: localize("common.error"),
                text2: localize("history.errors.delete_all_failed"),
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const shareLocation = async (coordinates?: {
    latitude: number | undefined;
    longitude: number | undefined;
  }) => {
    setLoading(true);
    setLoadingMessage(localize("history.share_location"));
    setTimeout(async () => {
      try {
        await ShareLocationAsync(Maps.google, {
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
        });
      } catch (err) {
        console.error("❌ Failed to share the location:", err);
        Toast.show({
          type: "error",
          text1: localize("common.error"),
          text2: localize("history.errors.share_failed"),
        });
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleUpdateLocation = async (data: LocationDetails) => {
    setModalVisible(false);
    setLoading(true);
    setLoadingMessage(localize("history.update_location"));

    (async () => {
      await updateLocationAsync({
        database,
        id: selectedItem?.id,
        title: data.title?.trim(),
        level: data.level?.trim(),
        section: data.section?.trim(),
        spot: data.spot?.trim(),
        comments: data.comments?.trim(),
        onSuccess: () => {
          setLocations((prev) =>
            prev.map((item) =>
              item.id === selectedItem?.id
                ? {
                    ...item,
                    title: data.title?.trim(),
                    level: data.level?.trim(),
                    section: data.section?.trim(),
                    spot: data.spot?.trim(),
                    comments: data.comments?.trim(),
                  }
                : item,
            ),
          );
          setSelectedItem((prev) =>
            prev
              ? {
                  ...prev,
                  title: data.title?.trim(),
                  level: data.level?.trim(),
                  section: data.section?.trim(),
                  spot: data.spot?.trim(),
                  comments: data.comments?.trim(),
                }
              : prev,
          );
          setLoading(false);
          Toast.show({
            type: "success",
            text1: localize("common.success"),
            text2:
              selectedItem?.type === "favorites"
                ? localize("history.success.favorite_updated")
                : localize("history.success.parking_updated"),
          });
        },
        onError: (message) => {
          setLoading(false);
          console.error("❌ Failed to update location:", message);
          Toast.show({
            type: "error",
            text1: localize("common.error"),
            text2: localize("history.errors.update_failed"),
          });
        },
      });
    })();
  };

  const handleUpdateReminder = async (minutes: number) => {
    console.log("Selected time in minutes:", minutes);
    setModalVisible(false);
    setLoading(true);
    setLoadingMessage(localize("history.updating_reminder"));

    try {
      let hasActiveReminder = false;

      await hasSchedulerAsync({
        locationId: selectedItem!.id,
        onSuccess: (hasActive) => {
          hasActiveReminder = hasActive;
        },
        onError: (message) => {
          console.error("❌ Failed to check active reminder:", message);
        },
      });

      if (!hasActiveReminder) {
        console.log(
          `No active reminder found for location ${selectedItem!.id}`,
        );
        return;
      }

      // Cancel native reminder
      await cancelSchedulerAsync({
        locationId: selectedItem!.id,
        onSuccess: () => console.log("✅ Old reminder cancelled"),
        onError: (message) => console.error("❌ Failed to cancel:", message),
      });

      // Update DB + schedule new native reminder
      const scheduled = await rescheduleReminderAsync({
        database,
        locationId: selectedItem!.id,
        title: selectedItem!.title ?? "Parking reminder",
        durationMinutes: minutes,
        notifyBeforeMinutes: REMINDER_CONFIG.DEFAULT_NOTIFY_BEFORE_MINUTES,
      });

      if (scheduled) {
        const now = Date.now();
        const updatedFields = {
          startTime: now,
          durationMinutes: minutes,
          endTime: now + minutes * 60 * 1000,
          notifyBeforeMinutes: REMINDER_CONFIG.DEFAULT_NOTIFY_BEFORE_MINUTES,
        };

        setLocations((prev) =>
          prev.map((item) =>
            item.id === selectedItem!.id ? { ...item, ...updatedFields } : item,
          ),
        );

        setSelectedItem((prev) =>
          prev ? { ...prev, ...updatedFields } : prev,
        );

        Toast.show({
          type: "success",
          text1: localize("common.success"),
          text2: localize("history.success.reminder_updated"),
        });
      }
    } catch (error) {
      console.error("❌ handleUpdateReminder error:", error);
      Toast.show({
        type: "error",
        text1: localize("common.error"),
        text2: localize("history.errors.reminder_update_failed"),
      });
    } finally {
      setLoading(false);
    }
  };

  const TAB_TO_TYPE: Record<number, string> = {
    [TABS_CONFIG.FAVORITES]: "favorites",
    [TABS_CONFIG.PARKING]: "parking",
  };

  const filteredLocations =
    selectedTab === TABS_CONFIG.ALL
      ? locations
      : locations.filter((item) => item.type === TAB_TO_TYPE[selectedTab]);

  const renderItem = ({ item }: { item: CardItem }) => (
    <LocationCard
      item={item}
      isMultiSelectMode={isMultiSelectMode}
      isSelected={selectedLocations.includes(item.id)}
      onPress={() => {
        setSelectedItem(item);
        setCardOptionsVisible(!isMultiSelectMode);
        if (isMultiSelectMode) {
          toggleSelection(item.id);
        }
      }}
      onLongPress={() => {
        setIsMultiSelectMode(true);
      }}
    />
  );

  const onCopyCoordinates = (item?: CardItem | null) => {
    if (item) {
      const value = `${item.latitude}, ${item.longitude}`;
      Clipboard.setStringAsync(value);

      Toast.show({
        type: "success",
        text1: localize("history.success.copied"),
        text2: localize("history.success.coordinates_copied"),
      });
    } else {
      Toast.show({
        type: "error",
        text1: localize("common.error"),
        text2: localize("history.errors.location_not_found"),
      });
    }
  };

  const onCopyAddress = (item?: CardItem | null) => {
    if (item) {
      const { street, city, region, postalCode, country } = item;

      const missingFields = [street, city, region, postalCode, country].some(
        (field) => !field || field.trim() === "",
      );

      const address = formatAddress({
        street: item.street,
        city: item.city,
        region: item.region,
        postalCode: item.postalCode,
        country: item.country,
      });

      Clipboard.setStringAsync(address);

      Toast.show({
        type: "success",
        text1: missingFields
          ? `⚠️ ${localize("history.success.copied")}`
          : localize("history.success.copied"),
        text2: missingFields
          ? localize("history.success.address_copied_missing")
          : localize("history.success.address_copied"),
      });
    } else {
      Toast.show({
        type: "error",
        text1: localize("common.error"),
        text2: localize("history.errors.address_not_available"),
      });
    }
  };

  const toggleSelectionAll = (selected: boolean) => {
    setSelectedAll(selected);
    setSelectedLocations(selected ? locations.map((item) => item.id) : []);
  };

  const toggleSelection = (id: number) => {
    setSelectedLocations((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];

      setSelectedAll(
        locations.length > 0 &&
          locations.every((item) => next.includes(item.id)),
      );

      return next;
    });
  };

  const isDisabled = loading || selectedLocations.length === 0;

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
      <View style={styles.tabs}>
        {[TABS_CONFIG.ALL, TABS_CONFIG.FAVORITES, TABS_CONFIG.PARKING].map(
          (tab) => (
            <Pressable
              key={tab}
              onPress={() => setSelectedTab(tab as typeof selectedTab)}
              style={[styles.tab, selectedTab === tab && styles.tabSelected]}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextSelected,
                ]}
              >
                {/* {tab.charAt(0).toUpperCase() + tab.slice(1)} */}
                {localize(`history.tabs.${tab}`)}
              </Text>
            </Pressable>
          ),
        )}
      </View>
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <View style={{ height: 48, transform: [{ perspective: 1000 }] }}>
          <Animated.View
            style={{
              position: "absolute",
              width: "100%",
              transform: [{ rotateY: searchRotate }],
              opacity: searchOpacity,
            }}
            pointerEvents={isMultiSelectMode ? "none" : "auto"}
          >
            <TextInput
              placeholder={localize("history.search_placeholder")}
              value={searchText}
              onChangeText={setSearchText}
              style={{
                backgroundColor: "#fff",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </Animated.View>

          <Animated.View
            style={{
              position: "absolute",
              width: "100%",
              transform: [{ rotateY: toolbarRotate }],
              opacity: toolbarOpacity,
            }}
            pointerEvents={isMultiSelectMode ? "auto" : "none"}
          >
            <View style={styles.container}>
              {/* Select All */}
              <TouchableOpacity
                onPress={() => toggleSelectionAll(!selectedAll)}
                style={styles.button}
              >
                <Text style={styles.emoji}>{selectedAll ? "☑️" : "⬜️"}</Text>
              </TouchableOpacity>

              {/* Exit */}
              <TouchableOpacity
                onPress={() => {
                  setIsMultiSelectMode(false);
                  setSelectedAll(false);
                  setSelectedLocations([]);
                }}
                style={styles.button}
              >
                <Text style={styles.emoji}>❌</Text>
              </TouchableOpacity>

              {/* Count */}
              <View style={styles.selectedCount}>
                <Text>{selectedLocations.length} selected</Text>
              </View>

              {/* Delete */}
              <TouchableOpacity
                disabled={isDisabled}
                onPress={isDisabled ? undefined : deleteAllLocations}
                style={[styles.button, isDisabled && styles.buttonDisabled]}
              >
                <Text style={styles.emoji}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>

      {filteredLocations.length === 0 ? (
        <EmptyComponent text={localize("history.no_locations")} />
      ) : (
        <FlatList
          data={filteredLocations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReached={() => {
            if (hasMore) {
              loadPage(page + 1);
              setSelectedAll(false);
            }
          }}
          showsVerticalScrollIndicator={true}
        />
      )}

      <ModalComponent
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        {parkTimeMode === "adjust" ? (
          <AdjustParkTimeComponent
            onSubmit={(minutes) => {
              console.log(selectedItem);
              handleUpdateReminder(minutes);
            }}
          />
        ) : (
          <LocationDetailsComponent
            mode={detailsMode}
            action={selectedItem?.type}
            initialData={{
              title: selectedItem?.title ? selectedItem?.title?.trim() : "",
              level: selectedItem?.level ? selectedItem?.level?.trim() : "",
              section: selectedItem?.section
                ? selectedItem?.section?.trim()
                : "",
              spot: selectedItem?.spot ? selectedItem?.spot?.trim() : "",
              comments: selectedItem?.comments
                ? selectedItem?.comments?.trim()
                : "",
            }}
            onSubmit={(data) => {
              handleUpdateLocation(data);
            }}
          />
        )}
      </ModalComponent>

      <LocationCardOptionsComponent
        item={selectedItem}
        visible={cardOptionsVisible}
        onClose={() => setCardOptionsVisible(false)}
        onShare={() =>
          shareLocation({
            latitude: selectedItem?.latitude,
            longitude: selectedItem?.longitude,
          })
        }
        onDelete={() => deleteLocation(selectedItem?.id)}
        onNavigate={() => openInMaps(selectedItem)}
        onViewDetails={() => {
          setParkTimeMode(undefined);
          setDetailsMode("view");
          setModalVisible(true);
        }}
        onUpdateDetails={() => {
          setParkTimeMode(undefined);
          setDetailsMode("update");
          setModalVisible(true);
        }}
        onCopyCoordinates={() => onCopyCoordinates(selectedItem)}
        onCopyAddress={() => onCopyAddress(selectedItem)}
        onAdjustParkingDuration={() => {
          setParkTimeMode("adjust");
          setModalVisible(true);
        }}
      />

      {loading && <LoadingComponent message={loadingMessage} />}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: 0,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    backgroundColor: colors.bg,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  tabSelected: {
    backgroundColor: colors.tab,
  },
  tabText: {
    color: colors.text,
    fontWeight: "500",
  },
  tabTextSelected: {
    color: "#fff",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    marginHorizontal: 8,
  },
  emoji: {
    fontSize: 16,
  },
  selectedCount: {
    flex: 1,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
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
    gap: 10,
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
  logoText: {
    fontSize: 17,
    fontWeight: "900",
    color: "white",
    letterSpacing: -0.3,
  },
  logoSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    marginTop: 1,
  },
  menuBtn: {
    width: 34,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
