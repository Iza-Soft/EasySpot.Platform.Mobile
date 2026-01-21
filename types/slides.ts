export type SlideItem = {
  emoji?: string;
  title: string;
  description: string;
  action:
    | "parking"
    | "navigate"
    | "history"
    | "share"
    | "favorites"
    | "location_activity";
  disabled: boolean;
};
