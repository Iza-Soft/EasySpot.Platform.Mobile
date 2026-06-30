import { useTranslation } from "react-i18next";
import { SlideItem } from "../types/slides";

export const useSlideItems = (): SlideItem[] => {
  const { t } = useTranslation();

  return [
    {
      emoji: "📍",
      title: t("slides.parking.title"),
      description: t("slides.parking.description"),
      action: "parking",
      disabled: false,
    },
    {
      emoji: "🗺️",
      title: t("slides.navigate.title"),
      description: t("slides.navigate.description"),
      action: "navigate",
      disabled: false,
    },
    {
      emoji: "📖",
      title: t("slides.history.title"),
      description: t("slides.history.description"),
      action: "history",
      disabled: false,
    },
    {
      emoji: "📤",
      title: t("slides.share.title"),
      description: t("slides.share.description"),
      action: "share",
      disabled: false,
    },
    {
      emoji: "⭐",
      title: t("slides.favorites.title"),
      description: t("slides.favorites.description"),
      action: "favorites",
      disabled: false,
    },
  ];
};
