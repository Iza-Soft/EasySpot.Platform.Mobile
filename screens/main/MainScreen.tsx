import {
  StyleSheet,
  View,
  FlatList,
  Modal,
  TextInput,
  Text,
  TouchableOpacity,
} from "react-native";
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
import Toast from "react-native-toast-message";

export default function MainScreenComponent({ navigation }: any) {
  const database = useSQLiteContext();
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState<undefined | string>();
  const [action, setAction] = useState<undefined | string>();
  const [showDetails, setShowDetails] = useState(false);
  const [level, setLevel] = useState<undefined | string>();
  const [section, setSection] = useState<undefined | string>();
  const [spot, setSpot] = useState<undefined | string>();
  const [comments, setComments] = useState<undefined | string>();

  const handleSaveFavorite = async () => {
    setModalVisible(false);
    setLoading(true);

    setLoading(true);
    (async () => {
      await saveLocationAsync({
        database,
        action: action,
        title: title?.trim(),
        level: level?.trim(),
        section: section?.trim(),
        spot: spot?.trim(),
        comments: comments?.trim(),
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
      setTitle("");
      setLevel(undefined);
      setSection(undefined);
      setSpot(undefined);
      setComments(undefined);
      setAction(action);
      setModalVisible(true);
      setShowDetails(false);
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
        renderItem={({ item }) => <SlideCard item={item} onPress={onPress} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {loading && <Loading message="Saving your spot…" />}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              width: "100%",
              padding: 20,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Add a meaningful title to remember this place
            </Text>

            <TextInput
              placeholder="E.g. Home, Work, Gym"
              value={title}
              onChangeText={setTitle}
              maxLength={25}
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                marginBottom: 16,
              }}
            />
            {action === "parking" && (
              <TouchableOpacity
                onPress={() => setShowDetails(!showDetails)}
                style={{ marginBottom: 16, paddingVertical: 4 }}
              >
                <Text style={{ color: colors.tab, fontWeight: "600" }}>
                  {!showDetails ? "+" : "-"} Add more details (optional)
                </Text>
              </TouchableOpacity>
            )}
            {showDetails && (
              <>
                {/* ROW: LEVEL + SECTION + SPOT */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  {/* LEVEL */}
                  <TextInput
                    placeholder="Level"
                    value={level}
                    onChangeText={setLevel}
                    maxLength={2}
                    style={{
                      width: "30%",
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                    }}
                  />

                  {/* SECTION */}
                  <TextInput
                    placeholder="Section"
                    value={section}
                    onChangeText={setSection}
                    maxLength={5}
                    style={{
                      width: "30%",
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                    }}
                  />

                  {/* SPOT */}
                  <TextInput
                    placeholder="Spot"
                    value={spot}
                    onChangeText={setSpot}
                    maxLength={10}
                    style={{
                      width: "30%",
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                    }}
                  />
                </View>

                {/* COMMENTS TEXTAREA (full width) */}
                <TextInput
                  placeholder="Comments (optional)"
                  value={comments}
                  onChangeText={setComments}
                  multiline
                  numberOfLines={3}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    marginBottom: 16,
                    height: 90,
                    textAlignVertical: "top",
                  }}
                />
              </>
            )}
            <TouchableOpacity
              style={{
                backgroundColor: colors.tab,
                padding: 12,
                borderRadius: 8,
                marginBottom: 8,
              }}
              onPress={() => handleSaveFavorite()}
            >
              <Text
                style={{
                  color: colors.bg,
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ padding: 10 }}
              onPress={() => setModalVisible(false)}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "red",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
