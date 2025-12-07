import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  DimensionValue,
} from "react-native";
import { useState } from "react";
import { colors } from "../../themes/main";

export type LocationDetails = {
  id?: string;
  title: string;
  level?: string;
  section?: string;
  spot?: string;
  comments?: string;
};

type Props = {
  mode: "edit" | "view";
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
  const isEdit = mode === "edit";
  const [title, setTitle] = useState(initialData.title || "");
  const [level, setLevel] = useState(initialData.level || "");
  const [section, setSection] = useState(initialData.section || "");
  const [spot, setSpot] = useState(initialData.spot || "");
  const [comments, setComments] = useState(initialData.comments || "");

  const [showDetails, setShowDetails] = useState(
    mode === "edit" ? false : true
  );

  function handleSave() {
    if (!onSubmit) return;
    onSubmit({ ...initialData, title, level, section, spot, comments });
  }

  function renderInput(
    label: string,
    value: string,
    maxLength: number,
    setter?: (v: string) => void,
    placeholder?: string | undefined,
    width?: DimensionValue
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
        "E.g. Home, Work, Gym"
      )}
      {action === "parking" && mode !== "view" && (
        <TouchableOpacity
          onPress={() => setShowDetails(!showDetails)}
          style={{ marginBottom: 8, paddingVertical: 4 }}
        >
          <Text style={{ color: colors.tab, fontWeight: "600" }}>
            {!showDetails ? "+" : "-"} Add more details (optional)
          </Text>
        </TouchableOpacity>
      )}
      {showDetails && (
        <>
          {renderInput(
            "Level",
            level,
            5,
            isEdit ? setLevel : undefined,
            "E.g. -3, 1, P2"
          )}
          {renderInput(
            "Section",
            section,
            10,
            isEdit ? setSection : undefined,
            "E.g. A, Green Zone, B-West"
          )}
          {renderInput(
            "Spot",
            spot,
            10,
            isEdit ? setSpot : undefined,
            "E.g. 123, B19, P3-027"
          )}
        </>
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
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <Text
            style={{ color: colors.bg, textAlign: "center", fontWeight: "600" }}
          >
            Save
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
