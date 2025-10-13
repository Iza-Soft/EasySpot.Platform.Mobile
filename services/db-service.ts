import { SQLiteDatabase } from "expo-sqlite";
import { SQL } from "../constants/queries";
import { LocationData } from "../types/common";
import { CardItem } from "../types/common";

export const DB_NAME = "easyspot.db";

export const createDBifNeeded = async (db: SQLiteDatabase) => {
  //await db.execAsync(SQL.DROP_LOCATION_TABLE); - DO NOT USE DROP IN PRODUCTION
  console.log("Checking database...");
  await db.execAsync(SQL.CREATE_LOCATION_TABLE);
  console.log("✅ Database initialized and ready.");
};

export const saveLocationDB = async (
  db: SQLiteDatabase,
  params: any[] = []
) => {
  try {
    await db.runAsync(SQL.INSERT_LOCATION, params);
  } catch (error) {
    throw error;
  }
};

export const getLastSavedLocationDB = async (
  db: SQLiteDatabase
): Promise<LocationData | null> => {
  try {
    const result = await db.getFirstAsync<LocationData>(
      SQL.SELECT_LAST_LOCATION
    );
    return result || null;
  } catch (error) {
    throw error;
  }
};

export const getAllSavedLocationDB = async (
  db: SQLiteDatabase
): Promise<CardItem[] | null> => {
  try {
    const result = await db.getAllAsync<CardItem>(SQL.SELECT_ALL_LOCATION);
    return result || null;
  } catch (error) {
    throw error;
  }
};

export const deleteLocationDB = async (
  db: SQLiteDatabase,
  params: any[] = []
) => {
  try {
    await db.runAsync(SQL.DELETE_LOCATION, params);
  } catch (error) {
    throw error;
  }
};
