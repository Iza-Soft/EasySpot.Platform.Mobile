// import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import { useState } from "react";
// import { colors } from "../../themes/main";
// import SegmentedControl from "@react-native-segmented-control/segmented-control";

// interface AdjustParkTimeComponentProps {
//   defaultHours?: number;
//   onTimeChange?: (hours: number) => void;
// }

// export default function AdjustParkTimeComponent({
//   defaultHours = 1,
//   onTimeChange,
// }: AdjustParkTimeComponentProps) {
//   const [selectedHours, setSelectedHours] = useState<number>(defaultHours);

//   const handleTimeChange = (hours: number) => {
//     setSelectedHours(hours);
//     onTimeChange?.(hours);
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Adjust parking time</Text>
//       <Text style={styles.description}>
//         Default parking time is 1 hour. You can change it below – you will be
//         notified 15 minutes before your selected time ends.
//       </Text>

//       <Text style={styles.title}>Please make your selection.</Text>

//       <SegmentedControl
//         values={["1 hour", "2 hours", "4 hours"]}
//         selectedIndex={selectedHours === 1 ? 0 : selectedHours === 2 ? 1 : 2}
//         onChange={(event) => {
//           const index = event.nativeEvent.selectedSegmentIndex;
//           const hours = index === 0 ? 1 : index === 1 ? 2 : 4;
//           handleTimeChange(hours);
//         }}
//         tintColor={colors.tab}
//         style={{ marginVertical: 12 }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     width: "100%",
//   },
//   header: {
//     fontSize: 18,
//     fontWeight: "700",
//     marginBottom: 10,
//     color: colors.text,
//   },
//   title: {
//     fontSize: 13,
//   },
//   description: {
//     fontSize: 13,
//     color: colors.muted,
//     marginBottom: 10,
//     fontStyle: "italic",
//   },
// });

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { colors } from "../../themes/main";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { REMINDER_CONFIG } from "../../config/reminder.config";

const HOUR_OPTIONS = REMINDER_CONFIG.DURATION_OPTIONS_MINUTES.map(
  (m) => m / 60,
); // [1, 2, 4]
const SEGMENT_VALUES = ["1h", "2h", "4h", "Other"];

interface AdjustParkTimeComponentProps {
  defaultHours?: number;
  onTimeChange?: (hours: number) => void;
  onSubmit: (minutes: number) => void;
}

export default function AdjustParkTimeComponent({
  defaultHours = 1,
  onTimeChange,
  onSubmit,
}: AdjustParkTimeComponentProps) {
  const defaultIndex = HOUR_OPTIONS.indexOf(defaultHours);
  const [selectedIndex, setSelectedIndex] = useState(
    defaultIndex >= 0 ? defaultIndex : 0,
  );
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");

  const isOther = selectedIndex === 3;

  const handleSegmentChange = (index: number) => {
    setSelectedIndex(index);
    if (index !== 3) {
      onTimeChange?.(HOUR_OPTIONS[index]);
    }
  };

  const handleCustomChange = (h: string, m: string) => {
    const total = parseFloat(h || "0") + parseFloat(m || "0") / 60;
    onTimeChange?.(total);
  };

  const getReminderTime = () => {
    const totalMins = isOther
      ? parseInt(customHours || "0") * 60 + parseInt(customMinutes || "0") - 15
      : HOUR_OPTIONS[selectedIndex] * 60 - 15;

    if (totalMins <= 0) return "—";
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const getSelectedLabel = () => {
    if (!isOther) {
      const h = HOUR_OPTIONS[selectedIndex];
      return `${h} hour${h > 1 ? "s" : ""}`;
    }
    const h = parseInt(customHours || "0");
    const m = parseInt(customMinutes || "0");
    return h || m ? `${h}h ${String(m).padStart(2, "0")}min` : "Custom";
  };

  const getTotalMinutes = () => {
    if (isOther) {
      return parseInt(customHours || "0") * 60 + parseInt(customMinutes || "0");
    }
    return HOUR_OPTIONS[selectedIndex] * 60;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Parking duration</Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>
        Default parking time is 1 hour. You can change it below – you will be
        notified <Text style={styles.descriptionAccent}>15 min before</Text>{" "}
        time runs out.
      </Text>

      {/* Segmented Control */}
      <SegmentedControl
        values={SEGMENT_VALUES}
        selectedIndex={selectedIndex}
        onChange={(e) =>
          handleSegmentChange(e.nativeEvent.selectedSegmentIndex)
        }
        fontStyle={{ color: colors.tab, fontWeight: "600" }}
        activeFontStyle={{ color: colors.textOnDark, fontWeight: "600" }}
        tintColor={colors.tab}
        style={styles.segmented}
      />

      {/* Custom time inputs */}
      {isOther && (
        <View style={styles.customRow}>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              maxLength={2}
              value={customHours}
              onChangeText={(v) => {
                setCustomHours(v);
                handleCustomChange(v, customMinutes);
              }}
            />
            <Text style={styles.inputLabel}>hours</Text>
          </View>

          <Text style={styles.separator}>:</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              maxLength={2}
              value={customMinutes}
              onChangeText={(v) => {
                const numeric = v.replace(/[^0-9]/g, "").slice(0, 2);
                const minMinutes =
                  customHours === "" || customHours === "0" ? 16 : 0;
                const clamped =
                  numeric.length === 2
                    ? String(
                        Math.min(59, Math.max(minMinutes, parseInt(numeric))),
                      )
                    : numeric;
                setCustomMinutes(clamped);
                handleCustomChange(customHours, clamped);
              }}
            />
            <Text style={styles.inputLabel}>min</Text>
          </View>
        </View>
      )}

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Selected</Text>
          <Text style={styles.summaryValue}>{getSelectedLabel()}</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryLabel}>Reminder at</Text>
          <Text style={[styles.summaryValue, styles.summaryAccent]}>
            {getReminderTime()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() =>
          //console.log("Selected time in minutes:", getTotalMinutes())
          onSubmit(getTotalMinutes())
        }
      >
        <Text style={styles.confirmText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: `${colors.tab}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 18,
  },
  header: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
    marginBottom: 14,
  },
  descriptionAccent: {
    color: colors.tab,
    fontWeight: "600",
  },
  segmented: {
    marginBottom: 14,
    height: 40,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
  },
  inputGroup: {
    alignItems: "center",
    gap: 5,
  },
  input: {
    width: 90,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.tab,
    backgroundColor: colors.bg,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  separator: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.muted,
    paddingBottom: 22,
  },
  summaryCard: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  summaryRight: {
    alignItems: "flex-end",
  },
  summaryAccent: {
    color: colors.tab,
  },

  confirmButton: {
    backgroundColor: colors.tab,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textOnDark,
  },
});
