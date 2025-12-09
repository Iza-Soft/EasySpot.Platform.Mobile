import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { colors } from "../../themes/main";
import { useEffect, useState } from "react";
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
  deleteLocationAsync,
  getAllSavedLocationAsync,
} from "../../services/location-service";
import Toast from "react-native-toast-message";
import ModalComponent from "../../components/modal/ModalComponent";
import LocationCardOptionsComponent from "../../components/LocationCardOptionsComponent";
import LocationDetailsComponent from "../../components/modal/LocationDetailsComponent";

export default function HistoryScreenComponent() {
  const database = useSQLiteContext();
  const [locations, setLocations] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "all" | "favorites" | "parking"
  >("all");
  const [searchText, setSearchText] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);
  const [loadingMessage, setLoadingMessage] =
    useState<string>("Loading history…");

  const PAGE_SIZE = 20;
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [cardOptionsVisible, setCardOptionsVisible] = useState(false);

  useEffect(() => {
    loadPage(0, true);
  }, [searchText]);

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

  const shareLocation = async (coordinates?: {
    latitude: number | undefined;
    longitude: number | undefined;
  }) => {
    setCardOptionsVisible(false);
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

  const filteredLocations =
    selectedTab === "all"
      ? locations
      : locations.filter((item) => item.type === selectedTab);

  const renderItem = ({ item }: { item: CardItem }) => (
    <LocationCard
      item={item}
      onPress={() => {
        setSelectedItem(item);
        setCardOptionsVisible(true);
      }}
      onLongPress={() =>
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "This feature is temporarily unavailable.",
        })
      }
    />
  );

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
      {/* Search field */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <TextInput
          placeholder="Search locations..."
          value={searchText}
          onChangeText={setSearchText} // make sure you have this state
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
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
            if (hasMore) loadPage(page + 1);
          }}
          showsVerticalScrollIndicator={true}
        />
      )}

      {loading && <LoadingComponent message={loadingMessage} />}

      <ModalComponent
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <LocationDetailsComponent
          mode="view"
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
        onViewDetails={() => setModalVisible(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
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
});
