import { SQLiteDatabase } from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";
import { migrateDb } from "./db-migrations";

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

/**
 * SQLiteProvider onInit hook. Schema changes live in db-migrations.ts
 * (versioned, transactional) — v1/v2 users upgrade in place to v3.
 */
export const createDBifNeeded = async (db: SQLiteDatabase) => {
  await migrateDb(db);
};

// 1.x helpers (save/delete locations and schedulers directly) were removed in 2.0:
// everything goes through services/spots-service.ts, which also cancels the
// reminder when a parking is deleted or ended.
