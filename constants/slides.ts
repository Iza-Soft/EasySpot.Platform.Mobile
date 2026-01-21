import { SlideItem } from "../types/slides";

export const SLIDE_ITEMS: SlideItem[] = [
  {
    emoji: "📍",
    title: "Mark Parking Spot",
    description: "Save your car’s location with one tap.",
    action: "parking",
    disabled: false,
  },
  {
    emoji: "🗺️",
    title: "Navigate Back",
    description: "Open maps with your last saved spot.",
    action: "navigate",
    disabled: false,
  },
  {
    emoji: "📖",
    title: "View History",
    description: "See your previously saved locations.",
    action: "history",
    disabled: false,
  },
  // {
  //   emoji: "⏱️",
  //   title: "Location Activity",
  //   description: "View places you’ve visited over time.",
  //   action: "location_activity",
  //   disabled: false,
  // },
  {
    emoji: "📤",
    title: "Share Spot",
    description: "Send your location to friends or family.",
    action: "share",
    disabled: false, // Feature not implemented yet
  },
  {
    emoji: "⭐",
    title: "Favorite Spots",
    description: "Save your favorite locations for quick access.",
    action: "favorites",
    disabled: false,
  },
];
