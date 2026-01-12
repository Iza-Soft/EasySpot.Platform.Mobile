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

export default function HistoryScreenComponent() {
  const database = useSQLiteContext();
  const [locations, setLocations] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "all" | "favorites" | "parking"
  >("all");
  const [searchText, setSearchText] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsMode, setDetailsMode] = useState<"edit" | "view" | "update">(
    "view"
  );
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
    Alert.alert("Delete", "Are you sure you want to delete this location?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setCardOptionsVisible(false);
          setLoadingMessage("Deleting location...");
          setLoading(true);
          await deleteLocationAsync({
            database,
            id,
            onSuccess: () => {
              setLocations((prev) => prev.filter((l) => l.id !== id));
              setLoading(false);
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Location deleted successfully.",
              });
            },
            onError: (message) => {
              console.error("❌ Failed to delete the location.:", message);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete the location.",
              });
              setLoading(false);
            },
          });
        },
      },
    ]);
  };

  const deleteAllLocations = async () => {
    Alert.alert("Delete", "Are you sure you want to delete all locations?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setCardOptionsVisible(false);
          setLoadingMessage("Deleting locations...");
          setLoading(true);
          await deleteAllLocationAsync({
            database,
            selectedLocations,
            onSuccess: () => {
              setLocations((prev) =>
                prev.filter((l) => !selectedLocations.includes(l.id))
              );
              setSelectedLocations([]);
              setIsMultiSelectMode(false);
              setLoading(false);
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Locations deleted successfully.",
              });
            },
            onError: (message) => {
              console.error("❌ Failed to delete the location.:", message);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete the location.",
              });
              setLoading(false);
            },
          });
        },
      },
    ]);
  };

  const shareLocation = async (coordinates?: {
    latitude: number | undefined;
    longitude: number | undefined;
  }) => {
    setLoading(true);
    setLoadingMessage("Share location...");
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
          text1: "Error",
          text2: "Failed to share the location.",
        });
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleUpdateLocation = async (data: LocationDetails) => {
    setModalVisible(false);
    setLoading(true);
    setLoadingMessage("Update location...");

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
                : item
            )
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
              : prev
          );
          setLoading(false);
          Toast.show({
            type: "success",
            text1: "Success",
            text2:
              selectedItem?.type === "favorites"
                ? "Favorite location updated successfully."
                : "Parking location update successfully.",
          });
        },
        onError: (message) => {
          setLoading(false);
          console.error("❌ Failed to update location:", message);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to update location.",
          });
        },
      });
    })();
  };

  const filteredLocations =
    selectedTab === "all"
      ? locations
      : locations.filter((item) => item.type === selectedTab);

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
        text1: "Copied",
        text2: "Coordinates copied to clipboard.",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to retrieve the saved location.",
      });
    }
  };

  const onCopyAddress = (item?: CardItem | null) => {
    if (item) {
      const { street, city, region, postalCode, country } = item;

      // Check if any required fields are missing
      const missingFields = [street, city, region, postalCode, country].some(
        (field) => !field || field.trim() === ""
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
        text1: missingFields ? "⚠️ Copied" : "Copied",
        text2: missingFields
          ? "Address copied, but some fields are missing."
          : "Address copied to clipboard.",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Address not available.",
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
          locations.every((item) => next.includes(item.id))
      );

      return next;
    });
  };

  const isDisabled = loading || selectedLocations.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.tabs}>
        {["all", "favorites", "parking"].map((tab) => (
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
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
              placeholder="Search locations..."
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
        <EmptyComponent text="No locations found 📂" />
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
        <LocationDetailsComponent
          mode={detailsMode}
          action={selectedItem?.type}
          initialData={{
            title: selectedItem?.title ? selectedItem?.title?.trim() : "",
            level: selectedItem?.level ? selectedItem?.level?.trim() : "",
            section: selectedItem?.section ? selectedItem?.section?.trim() : "",
            spot: selectedItem?.spot ? selectedItem?.spot?.trim() : "",
            comments: selectedItem?.comments
              ? selectedItem?.comments?.trim()
              : "",
          }}
          onSubmit={(data) => {
            handleUpdateLocation(data);
          }}
        />
      </ModalComponent>

      <LocationCardOptionsComponent
        title={selectedItem?.title ?? "(No title)"}
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
          setDetailsMode("view");
          setModalVisible(true);
        }}
        onUpdateDetails={() => {
          setDetailsMode("update");
          setModalVisible(true);
        }}
        onCopyCoordinates={() => onCopyCoordinates(selectedItem)}
        onCopyAddress={() => onCopyAddress(selectedItem)}
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
});
