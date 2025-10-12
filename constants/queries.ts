export const SQL = {
  DELETE_LOCATION: `DELETE FROM locations WHERE id = ?`,
  SELECT_ALL_LOCATION: `SELECT * FROM locations ORDER BY timestamp DESC`,
  SELECT_LAST_LOCATION: `SELECT * FROM locations ORDER BY timestamp DESC LIMIT 1`,
  INSERT_LOCATION: `INSERT INTO locations (latitude, longitude, street, city, region, postalCode, country, type, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  DROP_LOCATION_TABLE: `DROP TABLE IF EXISTS locations`,
  CREATE_LOCATION_TABLE: `CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        street TEXT,
        city TEXT,
        region TEXT,
        postalCode TEXT,
        country TEXT,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );`,
};
