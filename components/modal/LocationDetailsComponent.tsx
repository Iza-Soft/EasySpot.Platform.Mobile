import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  DimensionValue,
  Switch,
} from "react-native";
import { useEffect, useState } from "react";
import { colors } from "../../themes/main";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type LocationDetails = {
  id?: string;
  title: string;
  level?: string;
  section?: string;
  spot?: string;
  comments?: string;
  timerEnabled?: boolean;
};

type Props = {
  mode: "edit" | "view" | "update";
  action: string | undefined;
  initialData: LocationDetails;
  onSubmit?: (data: LocationDetails) => void; // only used in edit mode
};

export default function LocationDetailsComponent({
  mode,
  action,
  initialData,
  onSubmit,
}: Props) {
  const isEdit = mode === "edit" || mode === "update";
  const [title, setTitle] = useState(initialData.title || "");
  const [level, setLevel] = useState(initialData.level || "");
  const [section, setSection] = useState(initialData.section || "");
  const [spot, setSpot] = useState(initialData.spot || "");
  const [comments, setComments] = useState(initialData.comments || "");
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const [showDetails, setShowDetails] = useState(
    mode === "edit" ? false : true,
  );

  const [isTimerEnabled, setIsTimerEnabled] = useState(
    initialData.timerEnabled ?? false,
  );

  useEffect(() => {
    const checkReminderStatus = async () => {
      try {
        const reminder_enabled =
          await AsyncStorage.getItem("@reminder_enabled");
        setReminderEnabled(
          reminder_enabled ? JSON.parse(reminder_enabled) : false,
        );
      } catch (error) {
        console.error("Error reading reminder status:", error);
        setReminderEnabled(false);
      }
    };

    checkReminderStatus();
  }, []);

  function handleSave() {
    if (!onSubmit) return;
    onSubmit({
      ...initialData,
      title,
      level,
      section,
      spot,
      comments,
      timerEnabled: isTimerEnabled,
    });
  }

  function renderInput(
    label: string,
    value: string,
    maxLength: number,
    setter?: (v: string) => void,
    placeholder?: string | undefined,
    width?: DimensionValue,
  ) {
    return (
      <View>
        <Text style={{ marginBottom: 4 }}>{label}</Text>

        <TextInput
          placeholder={placeholder}
          value={value}
          editable={isEdit} // <-- disables in view mode
          onChangeText={setter}
          maxLength={maxLength}
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            marginBottom: 12,
            width: width || "100%",
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ width: "100%" }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          marginBottom: 16,
          color: colors.text,
        }}
      >
        Location Details
      </Text>
      {renderInput(
        "Title",
        title,
        25,
        isEdit ? setTitle : undefined,
        "E.g. Home, Work, Gym",
      )}
      {action === "parking" && mode !== "view" && mode !== "update" && (
        <TouchableOpacity
          onPress={() => setShowDetails(!showDetails)}
          style={{ marginBottom: 8, paddingVertical: 4 }}
        >
          <Text style={{ color: colors.tab, fontWeight: "600" }}>
            {!showDetails ? "+" : "-"} Add more details (optional)
          </Text>
        </TouchableOpacity>
      )}
      {action === "parking" && showDetails && (
        <>
          {renderInput(
            "Level",
            level,
            5,
            isEdit ? setLevel : undefined,
            "E.g. -3, 1, P2",
          )}
          {renderInput(
            "Section",
            section,
            10,
            isEdit ? setSection : undefined,
            "E.g. A, Green Zone, B-West",
          )}
          {renderInput(
            "Spot",
            spot,
            10,
            isEdit ? setSpot : undefined,
            "E.g. 123, B19, P3-027",
          )}
        </>
      )}
      {reminderEnabled &&
        action === "parking" &&
        mode !== "view" &&
        mode !== "update" && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              paddingVertical: 2,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={{ fontSize: 16 }}>🔔</Text>
              <Text style={{ color: colors.text }}>Parking reminder</Text>
            </View>

            <Switch
              value={isTimerEnabled}
              onValueChange={setIsTimerEnabled}
              trackColor={{ false: "#767577", true: colors.tab }}
              thumbColor={isTimerEnabled ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
        )}
      <Text style={{ marginBottom: 4 }}>Comments</Text>
      <TextInput
        placeholder="E.g. Opposite the blue column, beside motorcycle spaces"
        value={comments}
        editable={isEdit}
        multiline
        numberOfLines={3}
        onChangeText={isEdit ? setComments : undefined}
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
      {isEdit && (
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: colors.tab,
            padding: 14,
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <Text
            style={{ color: colors.bg, textAlign: "center", fontWeight: "600" }}
          >
            {mode === "edit" ? "Save" : "Update"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
