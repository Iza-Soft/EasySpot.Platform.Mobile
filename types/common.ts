export type CardItem = {
  id: number;
  latitude: number;
  longitude: number;
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  type: string; // 'favorite', 'parking', etc.
  timestamp: string;
};

export type LocationData = {
  latitude: number;
  longitude: number;
};
