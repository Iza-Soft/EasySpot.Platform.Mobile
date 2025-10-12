import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { colors } from "../../themes/main";
import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import Loading from "../../components/Loading";
import { openMapsAsync } from "../../services/navigation-service";
import { Maps } from "../../constants/maps";
import LocationCard from "../../components/LocationCard";
import { CardItem } from "../../types/common";
import EmptyComponent from "../../components/Empty";
import {
  deleteLocationAsync,
  getAllSavedLocationAsync,
} from "../../services/location-service";

export default function HistoryScreenComponent() {
  const database = useSQLiteContext();
  const [locations, setLocations] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "all" | "favorites" | "parking"
  >("all");

  useEffect(() => {
    (async () => {
      await getAllSavedLocationAsync({
        database,
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
  }, []);

  const openInMaps = async (item: CardItem) => {
    await openMapsAsync({
      latitude: item.latitude,
      longitude: item.longitude,
      map: Maps.google,
    });
  };

  const deleteLocation = async (id: number) => {
    Alert.alert("Delete", "Remove this location from history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteLocationAsync({
            database,
            id,
            onSuccess: () => {
              setLocations((prev) => prev.filter((l) => l.id !== id));
            },
            onError: (message) => {
              Alert.alert("Error", message);
            },
          });
        },
      },
    ]);
  };

  const filteredLocations =
    selectedTab === "all"
      ? locations
      : locations.filter((item) => item.type === selectedTab);

  const renderItem = ({ item }: { item: CardItem }) => (
    <LocationCard
      item={item}
      onPress={openInMaps}
      onLongPress={deleteLocation}
    />
  );

  if (loading) {
    return <Loading message="Loading history…" />;
  }

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
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontWeight: "500",
  },
  tabTextSelected: {
    color: "#fff",
  },
});
