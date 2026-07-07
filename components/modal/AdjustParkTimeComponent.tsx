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
import { useTranslation } from "react-i18next";
import { typography } from "../../themes/typography";
import AppText from "../AppTextComponent";

const HOUR_OPTIONS = REMINDER_CONFIG.DURATION_OPTIONS_MINUTES.map(
  (m) => m / 60,
); // [1, 2, 4]

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
  const { t: localize } = useTranslation();
  const SEGMENT_VALUES = [
    localize("adjust_park_time.segment_1h"),
    localize("adjust_park_time.segment_2h"),
    localize("adjust_park_time.segment_4h"),
    localize("adjust_park_time.segment_other"),
  ];
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
    const totalMins =
      isOther ?
        parseInt(customHours || "0") * 60 + parseInt(customMinutes || "0") - 15
      : HOUR_OPTIONS[selectedIndex] * 60 - 15;

    if (totalMins <= 0) return localize("adjust_park_time.no_reminder");
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ?
        `${h}${localize("adjust_park_time.hours_short")} ${m}${localize("adjust_park_time.min")}`
      : `${m}${localize("adjust_park_time.min")}`;
  };

  const getSelectedLabel = () => {
    if (!isOther) {
      const h = HOUR_OPTIONS[selectedIndex];
      return (
        h === 1 ? localize("adjust_park_time.label_1h")
        : h === 2 ? localize("adjust_park_time.label_2h")
        : localize("adjust_park_time.label_4h")
      );
    }
    const h = parseInt(customHours || "0");
    const m = parseInt(customMinutes || "0");
    return h || m ?
        `${h}${localize("adjust_park_time.hours_short")} ${String(m).padStart(2, "0")}${localize("adjust_park_time.min")}`
      : localize("adjust_park_time.custom");
  };

  const getTotalMinutes = () => {
    if (isOther) {
      return parseInt(customHours || "0") * 60 + parseInt(customMinutes || "0");
    }
    return HOUR_OPTIONS[selectedIndex] * 60;
  };

  const isValidInput =
    !isOther ||
    parseInt(customHours || "0") > 0 ||
    parseInt(customMinutes || "0") >= 16;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <AppText style={styles.header}>
          {localize("adjust_park_time.header")}
        </AppText>
      </View>

      {/* Description */}
      <AppText style={styles.description}>
        {localize("adjust_park_time.description_before")}
        <AppText style={styles.descriptionAccent}>
          {localize("adjust_park_time.description_highlight")}
        </AppText>
        {localize("adjust_park_time.description_after")}
      </AppText>

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
            <AppText style={styles.inputLabel}>
              {localize("adjust_park_time.hours")}
            </AppText>
          </View>

          <AppText style={styles.separator}>:</AppText>

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
                  numeric.length === 2 ?
                    String(
                      Math.min(59, Math.max(minMinutes, parseInt(numeric))),
                    )
                  : numeric;
                setCustomMinutes(clamped);
                handleCustomChange(customHours, clamped);
              }}
            />
            <AppText style={styles.inputLabel}>
              {localize("adjust_park_time.min")}
            </AppText>
          </View>
        </View>
      )}

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View>
          <AppText style={styles.summaryLabel}>
            {localize("adjust_park_time.selected")}
          </AppText>
          <AppText style={styles.summaryValue}>{getSelectedLabel()}</AppText>
        </View>
        <View style={styles.summaryRight}>
          <AppText style={styles.summaryLabel}>
            {localize("adjust_park_time.reminder_at")}
          </AppText>
          <AppText style={[styles.summaryValue, styles.summaryAccent]}>
            {getReminderTime()}
          </AppText>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          !isValidInput && styles.confirmButtonDisabled,
        ]}
        onPress={() => onSubmit(getTotalMinutes())}
        disabled={!isValidInput}
      >
        <AppText style={styles.confirmText}>
          {localize("adjust_park_time.confirm")}
        </AppText>
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
  header: typography.header,
  description: typography.bodySmall,
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
  summaryLabel: typography.label,
  summaryValue: { ...typography.header, marginBottom: 0 },
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
  confirmButtonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.5,
  },
});
