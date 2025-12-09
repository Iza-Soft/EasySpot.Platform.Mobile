import { SQLiteDatabase } from "expo-sqlite";
import { SQL } from "../constants/queries";
import { LocationData } from "../types/common";
import { CardItem } from "../types/common";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

export const DB_NAME = "easyspot.db";

/**
 * Opens or creates a persistent SQLite database inside
 * FileSystem.documentDirectory, which is not cleared by system optimizations.
 */
export async function openPersistentDB(): Promise<SQLiteDatabase> {
  try {
    const dbDir = `${FileSystem.documentDirectory}databases`;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbDir, {
        intermediates: true,
      });
    }

    // Path for the database file
    const dbPath = `${dbDir}/${DB_NAME}`;

    // Open the database (this will create it if it doesn't exist)
    const db = await SQLite.openDatabaseAsync(dbPath);

    console.log("✅ Database ready at:", dbPath);
    return db;
  } catch (error) {
    console.error("❌ Failed to open persistent database:", error);
    throw error;
  }
}

export const createDBifNeeded = async (db: SQLiteDatabase) => {
  //await db.execAsync(SQL.DROP_LOCATION_TABLE); - DO NOT USE DROP IN PRODUCTION

  const DATABASE_VERSION = 1;

  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const currentDbVersion = row?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) return;

  if (currentDbVersion === 0) {
    await db.execAsync(SQL.CREATE_LOCATION_TABLE);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  console.log("✅ Database migrated to version", DATABASE_VERSION);

  // console.log("Checking database...");
  // await db.execAsync(SQL.CREATE_LOCATION_TABLE);
  // console.log("✅ Database initialized and ready.");
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
  db: SQLiteDatabase,
  searchText?: string | undefined,
  limit?: number,
  offset?: number
): Promise<CardItem[] | null> => {
  try {
    if (limit == undefined || offset == undefined) {
      throw new Error("Pagination requires limit and offset values.");
    }

    if (!searchText || searchText.trim() === "") {
      const result = await db.getAllAsync<CardItem>(SQL.SELECT_ALL_LOCATION, [
        limit,
        offset,
      ]);
      return result || null;
    }

    const query = `%${searchText}%`; // LIKE pattern

    const result = await db.getAllAsync<CardItem>(SQL.SELECT_SEARCH_LOCATION, [
      query,
      query,
      query,
      query,
      query,
      limit,
      offset,
    ]);
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
