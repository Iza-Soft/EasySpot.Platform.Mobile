import { SQLiteDatabase } from "expo-sqlite";
import { SlideItem } from "./slides";
import { Maps } from "../constants/maps";
import { CardItem, LocationData } from "./common";

export type SlideCardProps = {
  item: SlideItem;
  onPress: (action: SlideItem["action"]) => void;
};

export type LocationProps<T = LocationData | CardItem[]> = {
  database: SQLiteDatabase;
  id?: number;
  action?: string;
  onSuccess?: (data?: T) => void;
  onError?: (message: string) => void;
};

export type NavigationProps = {
  latitude: number;
  longitude: number;
  map: Maps;
};

export type LocationCardProps = {
  item: CardItem;
  onPress: (item: CardItem) => void;
  onLongPress: (id: number) => void;
};
