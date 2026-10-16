import { SQLiteDatabase } from "expo-sqlite";
import { SQL } from "../constants/queries";

/**
 * Ordered, append-only schema migrations, keyed by PRAGMA user_version.
 * v1 and v2 are the shipped 1.x schema; never edit them — add a new entry.
 * Each migration runs inside a transaction together with the version bump,
 * so a failure leaves the DB at the previous version instead of half-migrated.
 */
interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: "1.0 — locations",
    up: (db) => db.execAsync(SQL.CREATE_LOCATION_TABLE),
  },
  {
    version: 2,
    description: "1.1 — parking timers",
    up: (db) => db.execAsync(SQL.CREATE_SCHEDULER_TABLE),
  },
  {
    version: 3,
    description: "2.0 — media, level source, pressure, ticket expiry, walk-back trail",
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE locations ADD COLUMN photoUri TEXT;
        ALTER TABLE locations ADD COLUMN voiceUri TEXT;
        ALTER TABLE locations ADD COLUMN levelSource TEXT CHECK (levelSource IN ('manual','ocr','barometer'));
        ALTER TABLE locations ADD COLUMN parkPressureHPa REAL;
        ALTER TABLE locations ADD COLUMN accuracyM REAL;
        ALTER TABLE locations ADD COLUMN ticketExpiresAt INTEGER;
        ALTER TABLE locations ADD COLUMN endedAt INTEGER;

        CREATE TABLE IF NOT EXISTS trail_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          locationId INTEGER NOT NULL,
          seq INTEGER NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('step','floor','gps','marker')),
          dxM REAL NOT NULL DEFAULT 0,
          dyM REAL NOT NULL DEFAULT 0,
          dzM REAL NOT NULL DEFAULT 0,
          headingDeg REAL,
          latitude REAL,
          longitude REAL,
          label TEXT,
          at INTEGER NOT NULL,
          FOREIGN KEY (locationId) REFERENCES locations(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_trail_location ON trail_points(locationId, seq);
        CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp);
      `);
    },
  },
  {
    version: 4,
    description: "2.0 — viewedAt (a new favourite place is marked \"New\" until opened)",
    up: (db) => db.execAsync("ALTER TABLE locations ADD COLUMN viewedAt INTEGER;"),
  },
];

export const LATEST_DB_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;

  for (const m of MIGRATIONS) {
    if (m.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await m.up(db);
      await db.execAsync(`PRAGMA user_version = ${m.version}`);
    });
    console.log(`✅ DB migrated to v${m.version}: ${m.description}`);
  }
}
