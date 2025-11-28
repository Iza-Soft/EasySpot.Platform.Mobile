export type CardItem = {
  id: number;
  latitude: number;
  longitude: number;
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  type: string; // 'favorite', 'parking', etc.
  title?: string;
  level?: string;
  section?: string;
  spot?: string;
  comments?: string;
  timestamp: string;
};

export type LocationData = {
  latitude: number;
  longitude: number;
};
