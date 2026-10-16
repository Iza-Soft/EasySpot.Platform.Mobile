/**
 * Runs the real spots-service SQL against an in-memory SQLite (node:sqlite),
 * through a tiny adapter with the expo-sqlite method names.
 */
import { MIGRATIONS } from "../db-migrations";

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  reverseGeocodeAsync: jest.fn(async () => [{ street: "Vitosha Blvd", city: "Sofia" }]),
}));
jest.mock("../../platform/location", () => ({
  ensureLocationPermission: jest.fn(async () => true),
  getCurrentFix: jest.fn(async () => ({ latitude: 42.69, longitude: 23.32, accuracy: 6, altitude: null, timestamp: 0, source: "android" })),
}));
const scheduled: unknown[] = [];
const cancelled: number[] = [];
jest.mock("../../platform/timer", () => ({
  scheduleParkingReminder: jest.fn(async (r: unknown) => {
    scheduled.push(r);
    return true;
  }),
  cancelParkingReminder: jest.fn(async (id: number) => {
    cancelled.push(id);
  }),
}));

const deletedPhotos: string[] = [];
jest.mock("../spot-photos", () => ({
  deletePhoto: jest.fn((rel: string) => {
    deletedPhotos.push(rel);
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require("node:sqlite");

function makeDb() {
  const raw = new DatabaseSync(":memory:");
  const db = {
    execAsync: async (sql: string) => raw.exec(sql),
    runAsync: async (sql: string, params: unknown[] = []) => {
      const r = raw.prepare(sql).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes };
    },
    getFirstAsync: async (sql: string, params: unknown[] = []) => raw.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql: string, params: unknown[] = []) => raw.prepare(sql).all(...params),
    withTransactionAsync: async (fn: () => Promise<void>) => {
      raw.exec("BEGIN");
      try {
        await fn();
        raw.exec("COMMIT");
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return db;
}

// Imported after the mocks.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const svc = require("../spots-service") as typeof import("../spots-service");

async function freshDb() {
  const db = makeDb();
  for (const m of MIGRATIONS) await m.up(db as never);
  return db as never;
}

beforeEach(() => {
  scheduled.length = 0;
  cancelled.length = 0;
});

test("PARK creates an active parking with address and accuracy", async () => {
  const db = await freshDb();
  const id = await svc.createSpot(db, "parking");
  const active = await svc.getActiveParking(db);
  expect(active?.id).toBe(id);
  expect(active?.street).toBe("Vitosha Blvd");
  expect(active?.city).toBe("Sofia");
  expect(active?.accuracyM).toBe(6);
  expect(active?.reminderEndsAt).toBeNull();
});

test("PARK keeps the air pressure (floors to the car later); a favourite place does not", async () => {
  const db = await freshDb();
  const loc = { latitude: 1, longitude: 2, accuracy: 5, street: null, district: null, city: null, region: null, postalCode: null, country: null };
  const p = await svc.insertSpot(db, "parking", { ...loc, pressureHPa: 1009.4 });
  const f = await svc.insertSpot(db, "favorites", { ...loc, pressureHPa: 1009.4 });
  const none = await svc.insertSpot(db, "parking", loc);
  expect((await svc.getSpot(db, p))?.parkPressureHPa).toBeCloseTo(1009.4);
  expect((await svc.getSpot(db, f))?.parkPressureHPa).toBeNull();
  expect((await svc.getSpot(db, none))?.parkPressureHPa).toBeNull();
});

test("a second PARK keeps the first one active (your car + a friend's)", async () => {
  const db = await freshDb();
  const first = await svc.createSpot(db, "parking");
  const second = await svc.createSpot(db, "parking");
  const active = await svc.getActiveParkings(db);
  expect(active.map((s) => s.id).sort()).toEqual([first, second].sort());
  expect(await svc.countActiveParkings(db)).toBe(2);
  expect((await svc.getSpot(db, first))?.endedAt).toBeNull();
});

test("after 24 h a parking is inactive — unless its paid time is still running", async () => {
  const db = await freshDb();
  const old = new Date(Date.now() - 26 * 3_600_000).toISOString();
  await (db as any).runAsync("INSERT INTO locations (latitude, longitude, type, timestamp) VALUES (1, 2, 'parking', ?)", [old]);
  await (db as any).runAsync("INSERT INTO locations (latitude, longitude, type, timestamp) VALUES (3, 4, 'parking', ?)", [old]);
  const paid = (await (db as any).getFirstAsync("SELECT id FROM locations WHERE latitude = 3")).id;
  await svc.setTimeLimit(db, paid, "Long stay", Date.now() + 3_600_000);
  const active = await svc.getActiveParkings(db);
  expect(active.map((s) => s.id)).toEqual([paid]);
  expect(svc.isActiveParking(active[0])).toBe(true);
});

test("a new favourite place is 'New' until opened", async () => {
  const db = await freshDb();
  const id = await svc.createSpot(db, "favorites");
  expect(svc.isNewPlace((await svc.getSpot(db, id))!)).toBe(true);
  await svc.markViewed(db, id);
  expect(svc.isNewPlace((await svc.getSpot(db, id))!)).toBe(false);
});

test("saving a favourite does not touch the active parking", async () => {
  const db = await freshDb();
  const p = await svc.createSpot(db, "parking");
  await svc.createSpot(db, "favorites");
  expect((await svc.getActiveParking(db))?.id).toBe(p);
});

test("old 1.x parking (no endedAt, > 24 h) is not treated as active", async () => {
  const db = await freshDb();
  const old = new Date(Date.now() - 30 * 3_600_000).toISOString();
  await (db as any).runAsync("INSERT INTO locations (latitude, longitude, type, timestamp) VALUES (1, 2, 'parking', ?)", [old]);
  expect(await svc.getActiveParking(db)).toBeNull();
});

test("details: level source becomes manual, empty strings become NULL", async () => {
  const db = await freshDb();
  const id = await svc.createSpot(db, "parking");
  await svc.updateSpotDetails(db, id, { level: " B2 ", section: "C", spot: "14", title: "", comments: "blue lift" });
  const s = (await svc.getSpot(db, id)) as any;
  expect([s.level, s.section, s.spot, s.title, s.comments, s.levelSource]).toEqual(["B2", "C", "14", null, "blue lift", "manual"]);
  await svc.updateSpotDetails(db, id, { level: "" });
  expect(((await svc.getSpot(db, id)) as any).levelSource).toBeNull();
});

test("inline level editor changes only level / zone / spot", async () => {
  const db = await freshDb();
  const id = await svc.createSpot(db, "parking");
  await svc.updateSpotDetails(db, id, { title: "Office", comments: "blue lift" });
  await svc.updateSpotLevel(db, id, { level: " B2 ", section: "C", spot: "" });
  const s = await svc.getSpot(db, id);
  expect(s).toMatchObject({ title: "Office", comments: "blue lift", level: "B2", section: "C", spot: null, levelSource: "manual" });
});

test("time limit: insert, extend (update same row), stop", async () => {
  const db = await freshDb();
  const id = await svc.createSpot(db, "parking");
  const endsAt = Date.now() + 60 * 60_000;
  await svc.setTimeLimit(db, id, "Spot", endsAt);
  let s = await svc.getActiveParking(db);
  expect(s?.reminderEndsAt).toBe(endsAt);
  expect(svc.hasActiveLimit(s!)).toBe(true);
  expect(scheduled).toHaveLength(1);

  await svc.setTimeLimit(db, id, "Spot", endsAt + 30 * 60_000);
  const rows = await (db as any).getAllAsync("SELECT * FROM schedulers WHERE locationId = ?", [id]);
  expect(rows).toHaveLength(1);
  expect(rows[0].endTime).toBe(endsAt + 30 * 60_000);

  await svc.stopReminder(db, id);
  s = await svc.getActiveParking(db);
  expect(svc.hasActiveLimit(s!)).toBe(false);
  expect(cancelled).toContain(id);
});

test("I'm back ends the parking and cancels the reminder", async () => {
  const db = await freshDb();
  const id = await svc.createSpot(db, "parking");
  await svc.setTimeLimit(db, id, "Spot", Date.now() + 3_600_000);
  await svc.endParking(db, id);
  expect(await svc.getActiveParking(db)).toBeNull();
  expect(cancelled).toContain(id);
});

test("list: filter by type, search by level/note, delete cascades scheduler", async () => {
  const db = await freshDb();
  const p = await svc.createSpot(db, "parking");
  await svc.updateSpotDetails(db, p, { level: "B2", comments: "blue lift" });
  await svc.setTimeLimit(db, p, "Spot", Date.now() + 3_600_000);
  const f = await svc.createSpot(db, "favorites");
  await svc.updateSpotDetails(db, f, { title: "Home" });

  expect((await svc.listSpots(db, { limit: 10, offset: 0 })).map((s) => s.id).sort()).toEqual([p, f].sort());
  expect((await svc.listSpots(db, { type: "favorites", limit: 10, offset: 0 })).map((s) => s.id)).toEqual([f]);
  expect((await svc.listSpots(db, { search: "b2", limit: 10, offset: 0 })).map((s) => s.id)).toEqual([p]);
  expect((await svc.listSpots(db, { search: "lift", limit: 10, offset: 0 })).map((s) => s.id)).toEqual([p]);

  await (db as any).execAsync("PRAGMA foreign_keys = ON");
  await svc.deleteSpot(db, p);
  expect(cancelled).toContain(p); // its reminder is cancelled too
  expect(await svc.getSpot(db, p)).toBeNull();
  expect(await (db as any).getAllAsync("SELECT * FROM schedulers WHERE locationId = ?", [p])).toHaveLength(0);
});

test("remindBeforeFor never schedules in the past", () => {
  const now = 1_000_000;
  expect(svc.remindBeforeFor(now + 60 * 60_000, now)).toBe(15);
  expect(svc.remindBeforeFor(now + 10 * 60_000, now)).toBe(5);
  expect(svc.remindBeforeFor(now + 60_000, now)).toBe(1);
  // Settings: "remind me 30 min before"
  expect(svc.remindBeforeFor(now + 2 * 60 * 60_000, now, 30)).toBe(30);
  expect(svc.remindBeforeFor(now + 2 * 60 * 60_000, now, 5)).toBe(5);
});

test("locateHere writes nothing — closing the Save sheet leaves no spot behind", async () => {
  const db = await freshDb();
  const loc = await svc.locateHere();
  expect(loc).toMatchObject({ latitude: 42.69, longitude: 23.32, street: "Vitosha Blvd", city: "Sofia" });
  expect(await svc.listSpots(db, { limit: 10, offset: 0 })).toHaveLength(0);
  expect(await svc.getActiveParking(db)).toBeNull();
  const id = await svc.insertSpot(db, "parking", loc);
  expect((await svc.getActiveParking(db))?.id).toBe(id);
});

test("app start: reminders still ahead are scheduled again; ended or already-reminded ones are not", async () => {
  const db = await freshDb();
  const now = Date.now();
  const ahead = await svc.createSpot(db, "parking");
  await svc.setTimeLimit(db, ahead, "Ahead", now + 2 * 3_600_000);
  const ended = await svc.createSpot(db, "parking");
  await svc.setTimeLimit(db, ended, "Ended", now + 2 * 3_600_000);
  await svc.endParking(db, ended);
  const soon = await svc.createSpot(db, "parking");
  await svc.setTimeLimit(db, soon, "Soon", now + 3 * 60_000); // reminder time already passed 10 min later
  scheduled.length = 0;

  expect(await svc.resyncReminders(db, "Parking", now)).toBe(2); // ahead + soon (still ahead now)
  expect(await svc.resyncReminders(db, "Parking", now + 10 * 60_000)).toBe(1); // only "ahead"
  expect((scheduled as { locationId: number }[]).map((r) => r.locationId)).not.toContain(ended);
});

test("photo, zone colour and plate are saved; End parking keeps the photo, Delete removes it", async () => {
  const db = await freshDb();
  deletedPhotos.length = 0;
  const id = await svc.createSpot(db, "parking");
  await svc.updateSpotDetails(db, id, {
    title: "Office garage - SA63USM",
    level: "B2",
    section: "C",
    spot: "214",
    zoneColor: "blue",
    photoUri: "photos/spot-1.jpg",
    plate: "SA63 USM",
  });
  let s = await svc.getSpot(db, id);
  expect([s?.zoneColor, s?.photoUri, s?.plate]).toEqual(["blue", "photos/spot-1.jpg", "SA63 USM"]);

  // Editing the name only leaves photo / colour / plate alone.
  await svc.updateSpotDetails(db, id, { title: "Office", level: "B2", section: "C", spot: "214" });
  s = await svc.getSpot(db, id);
  expect([s?.title, s?.photoUri, s?.zoneColor]).toEqual(["Office", "photos/spot-1.jpg", "blue"]);

  // Search finds it by the plate.
  expect((await svc.listSpots(db, { search: "SA63", limit: 10, offset: 0 })).map((x) => x.id)).toEqual([id]);

  await svc.endParking(db, id);
  expect(deletedPhotos).toEqual([]);
  expect((await svc.getSpot(db, id))?.photoUri).toBe("photos/spot-1.jpg");

  await svc.deleteSpot(db, id);
  expect(deletedPhotos).toEqual(["photos/spot-1.jpg"]);
});

test("+30 min then Undo puts the time limit back; an expired time is not reminded again", async () => {
  const db = await freshDb();
  const now = Date.now();
  const id = await svc.createSpot(db, "parking");
  await svc.setTimeLimit(db, id, "Car", now + 60 * 60_000);
  const before = svc.limitSnapshot((await svc.getSpot(db, id))!)!;
  await svc.setTimeLimit(db, id, "Car", before.endsAt + 30 * 60_000);
  expect((await svc.getSpot(db, id))?.reminderEndsAt).toBe(before.endsAt + 30 * 60_000);

  scheduled.length = 0;
  await svc.restoreTimeLimit(db, id, "Car", before);
  const s = await svc.getSpot(db, id);
  expect([s?.reminderEndsAt, s?.reminderStartedAt, s?.notifyBeforeMinutes]).toEqual([before.endsAt, before.startedAt, before.notifyBeforeMinutes]);
  expect(scheduled).toHaveLength(1);

  // Time already up when +30 was pressed → Undo makes it expired again, without a reminder.
  scheduled.length = 0;
  await svc.restoreTimeLimit(db, id, "Car", { endsAt: now - 5 * 60_000, startedAt: now - 65 * 60_000, notifyBeforeMinutes: 15 });
  expect(scheduled).toHaveLength(0);
  expect((await svc.getSpot(db, id))?.reminderEndsAt).toBe(now - 5 * 60_000);
});
