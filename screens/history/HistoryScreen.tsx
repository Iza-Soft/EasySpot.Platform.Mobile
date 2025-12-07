import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
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

  useEffect(() => {
    (async () => {
      await getAllSavedLocationAsync({
        database,
        searchText,
        onSuccess: async (results) => {
          setLoading(false);
          setLocations(results as CardItem[]);
        },
        onError: (message) => {
          setLoading(false);
          console.error("❌ Failed to load history:", message);
        },
      });
    })();
  }, [searchText]);

  const openInMaps = async (item: CardItem) => {
    await openMapsAsync({
      latitude: item.latitude,
      longitude: item.longitude,
      map: Maps.google,
    });
  };

  const deleteLocation = async (id: number | undefined) => {
    Alert.alert("Delete", "Are you sure you want to delete this location?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setModalVisible(false);
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
    setModalVisible(false);
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

  const openActionModal = (item: CardItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const filteredLocations =
    selectedTab === "all"
      ? locations
      : locations.filter((item) => item.type === selectedTab);

  const renderItem = ({ item }: { item: CardItem }) => (
    <LocationCard
      item={item}
      onPress={openInMaps}
      onLongPress={() => openActionModal(item)}
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
        />
      )}

      {loading && <LoadingComponent message={loadingMessage} />}

      <ModalComponent
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <Text style={styles.alertTitle}>
          Choose an option for: {selectedItem?.title ?? "(No Title)"}
        </Text>

        <Text style={styles.alertMessage}>
          You can delete or share this location. Choose an option below.
        </Text>
        <TouchableOpacity
          onPress={() => deleteLocation(selectedItem?.id)}
          style={{
            backgroundColor: colors.tab,
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <Text
            style={{ color: colors.bg, textAlign: "center", fontWeight: "600" }}
          >
            Delete
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            shareLocation({
              latitude: selectedItem?.latitude,
              longitude: selectedItem?.longitude,
            })
          }
          style={{
            backgroundColor: colors.tab,
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <Text
            style={{ color: colors.bg, textAlign: "center", fontWeight: "600" }}
          >
            Share
          </Text>
        </TouchableOpacity>
      </ModalComponent>
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
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: colors.text,
  },
  alertMessage: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 20,
  },
});
