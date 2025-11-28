import * as Location from "expo-location";
import { LocationProps } from "../types/props";
import {
  deleteLocationDB,
  getAllSavedLocationDB,
  getLastSavedLocationDB,
  saveLocationDB,
} from "./db-service";

export async function saveLocationAsync({
  database,
  action,
  title,
  level,
  section,
  spot,
  comments,
  onSuccess,
  onError,
}: LocationProps) {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      onError?.(
        "Location permission not granted. Please enable it in settings."
      );
      return;
    }

    const startTime = Date.now();
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = loc.coords;

    const [address] = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    await saveLocationDB(database, [
      latitude,
      longitude,
      address?.street || null,
      address?.city || null,
      address?.region || null,
      address?.postalCode || null,
      address?.country || null,
      action,
      title || null,
      level || null,
      section || null,
      spot || null,
      comments || null,
      new Date().toISOString(),
    ]);

    // Delay at least 1.5s for smoother UX
    const elapsed = Date.now() - startTime;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, 1500 - elapsed))
    );

    onSuccess?.();
  } catch (error) {
    console.error("saveLocationAsync error:", error);
    onError?.(`Failed to save ${action} location.`);
  }
}

export async function getLastSavedLocationAsync({
  database,
  onSuccess,
  onError,
}: LocationProps) {
  try {
    const location = await getLastSavedLocationDB(database);
    if (!location) {
      onError?.("No saved locations found.");
      return;
    }

    onSuccess?.(location);
  } catch (error) {
    console.error("getLastSavedLocationAsync error:", error);
    onError?.("Failed to retrieve last saved location.");
  }
}

export async function getAllSavedLocationAsync({
  database,
  searchText,
  onSuccess,
  onError,
}: LocationProps) {
  try {
    const locations = await getAllSavedLocationDB(database, searchText);
    if (!locations) {
      onError?.("No saved locations found.");
      return;
    }

    onSuccess?.(locations);
  } catch (error) {
    console.error("getAllSavedLocationAsync error:", error);
    onError?.("Failed to retrieve all saved locations.");
  }
}

export async function deleteLocationAsync({
  database,
  id,
  onSuccess,
  onError,
}: LocationProps) {
  try {
    await deleteLocationDB(database, [id]);

    onSuccess?.();
  } catch (error) {
    console.error("deleteLocation error:", error);
    onError?.(`Failed to delete location with ID = ${id}.`);
  }
}
