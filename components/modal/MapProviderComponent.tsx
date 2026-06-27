import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../themes/main";
import { Maps, MAP_PROVIDERS } from "../../constants/maps";
import {
  getPreferredMap,
  setPreferredMap,
} from "../../services/map-preference-service";
import { typography } from "../../themes/typography";

export default function MapProviderComponent() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Maps>(Maps.google);

  useEffect(() => {
    getPreferredMap().then(setSelected);
  }, []);

  const handleSelect = async (map: Maps) => {
    await setPreferredMap(map);
    setSelected(map);
  };

  // Скрий Apple Maps на Android
  const providers = MAP_PROVIDERS.filter(
    (p) => !(p.id === Maps.apple && Platform.OS === "android"),
  );

  const MapIcon = ({
    brandColor,
    initial,
    size = 25,
  }: {
    brandColor: string;
    initial: string;
    size?: number;
  }) => (
    <View
      style={[
        styles.mapIcon,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: brandColor,
        },
      ]}
    >
      <Text
        style={[styles.mapIconText, { fontSize: initial.length > 1 ? 11 : 18 }]}
      >
        {initial}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("settings.map_provider.title")}</Text>
      <Text style={styles.description}>
        {t("settings.map_provider.description")}
      </Text>

      <View style={styles.grid}>
        {providers.map((provider) => {
          const isSelected = selected === provider.id;
          return (
            <TouchableOpacity
              key={provider.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => handleSelect(provider.id)}
              activeOpacity={0.7}
            >
              <MapIcon
                brandColor={provider.brandColor}
                initial={provider.initial}
              />
              <Text
                style={[
                  styles.cardLabel,
                  isSelected && styles.cardLabelSelected,
                ]}
              >
                {provider.label}
              </Text>
              <Text style={styles.cardSub}>{provider.available}</Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingBottom: 20,
  },
  header: {
    ...typography.header,
    marginBottom: 8,
  },
  description: {
    ...typography.bodySmall,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "47%",
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: "relative",
  },
  cardSelected: {
    borderColor: colors.tab,
    backgroundColor: `${colors.tab}10`,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardLabel: {
    ...typography.cardTitle,
    marginBottom: 2,
  },
  cardLabelSelected: {
    color: colors.tab,
  },
  cardSub: {
    fontSize: 10,
    color: colors.muted,
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.tab,
    alignItems: "center",
    justifyContent: "center",
  },
  mapIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mapIconText: {
    color: "white",
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});
