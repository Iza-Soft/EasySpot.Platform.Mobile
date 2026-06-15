// import { SlideItem } from "../types/slides";

// export const SLIDE_ITEMS: SlideItem[] = [
//   {
//     emoji: "📍",
//     title: "Mark Parking Spot",
//     description: "Save your car’s location with one tap.",
//     action: "parking",
//     disabled: false,
//   },
//   {
//     emoji: "🗺️",
//     title: "Navigate Back",
//     description: "Open maps with your last saved spot.",
//     action: "navigate",
//     disabled: false,
//   },
//   {
//     emoji: "📖",
//     title: "View History",
//     description: "See your previously saved locations.",
//     action: "history",
//     disabled: false,
//   },
//   // {
//   //   emoji: "⏱️",
//   //   title: "Location Activity",
//   //   description: "View places you’ve visited over time.",
//   //   action: "location_activity",
//   //   disabled: false,
//   // },
//   {
//     emoji: "📤",
//     title: "Share Spot",
//     description: "Send your location to friends or family.",
//     action: "share",
//     disabled: false, // Feature not implemented yet
//   },
//   {
//     emoji: "⭐",
//     title: "Favorite Spots",
//     description: "Save your favorite locations for quick access.",
//     action: "favorites",
//     disabled: false,
//   },
// ];

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
