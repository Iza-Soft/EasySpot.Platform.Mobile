import { SQLiteDatabase } from "expo-sqlite";
import { getCurrentFix, ensureLocationPermission } from "../platform/location";
import { reverseGeocode, streetLine } from "./geocoding";
import { publishHere } from "../state/hereStore";
import { bumpSpots } from "../state/spotsStore";
import { getPrefs } from "../state/prefs";
import { cancelParkingReminder, scheduleParkingReminder } from "../platform/timer";

/**
 * v2 data access for saved spots (parking + favourite places).
 * Promise-based, returns ids — used by the 2.0 screens. The 1.x callback
 * services stay untouched for the legacy screens.
 */

export type SpotKind = "parking" | "favorites";

export interface Spot {
  id: number;
  type: SpotKind;
  latitude: number;
  longitude: number;
  street: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  title: string | null;
  level: string | null;
  section: string | null;
  spot: string | null;
  comments: string | null;
  timestamp: string;
  accuracyM: number | null;
  endedAt: number | null;
  /** When a favourite place was first opened (it is "New" until then, max 24 h). */
  viewedAt: number | null;
  /** From the joined scheduler row (parking time limit). */
  reminderEndsAt: number | null;
  reminderStartedAt: number | null;
  reminderActive: number | null;
  /** Minutes before the end the reminder fires (schedulers.notifyBeforeMinutes). */
  notifyBeforeMinutes?: number | null;
}

/**
 * A parking stays ACTIVE until "End parking", or until this long after it was
 * saved — unless its paid time is still running. Several parkings can be
 * active at once (your car + a friend's).
 */
export const ACTIVE_PARKING_WINDOW_MS = 24 * 3_600_000;
/** A new favourite place is shown as "New" until opened, at most this long. */
export const NEW_PLACE_WINDOW_MS = 24 * 3_600_000;
export const DEFAULT_REMIND_BEFORE_MIN = 15;

const SELECT_SPOT = `
  SELECT l.*, s.endTime AS reminderEndsAt, s.startTime AS reminderStartedAt, s.isActive AS reminderActive,
    s.notifyBeforeMinutes AS notifyBeforeMinutes
  FROM locations l LEFT JOIN schedulers s ON s.locationId = l.id`;

export class LocationPermissionError extends Error {}

/** A position + address that is NOT saved yet (shown in the Save sheet until the user confirms). */
export interface PendingLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  street: string | null;
  /** Shown in the Save sheet only (not stored). */
  district: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
}

/** Permission → position → (optional) address. Writes nothing. */
export async function locateHere(): Promise<PendingLocation> {
  if (!(await ensureLocationPermission("ask"))) throw new LocationPermissionError("Location permission not granted");

  // This fix gets saved: measure fresh unless a remembered one is accurate.
  const fix = await getCurrentFix({ fresh: true });
  const a = await reverseGeocode(fix.latitude, fix.longitude);
  // The newest measurement — Home shows the same accuracy from now on.
  publishHere(fix, a);
  return {
    latitude: fix.latitude,
    longitude: fix.longitude,
    accuracy: fix.accuracy,
    street: streetLine(a),
    district: a?.district ?? null,
    city: a?.city ?? null,
    region: a?.region ?? null,
    postalCode: a?.postalCode ?? null,
    country: a?.country ?? null,
  };
}

/** Saves a located spot. Other active parkings stay active. Returns the new id. */
export async function insertSpot(db: SQLiteDatabase, kind: SpotKind, loc: PendingLocation): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO locations (latitude, longitude, street, city, region, postalCode, country, type, accuracyM, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [loc.latitude, loc.longitude, loc.street, loc.city, loc.region, loc.postalCode, loc.country, kind, loc.accuracy, new Date().toISOString()],
  );
  bumpSpots();
  return result.lastInsertRowId;
}

/** locateHere + insertSpot in one call (no confirmation step). */
export async function createSpot(db: SQLiteDatabase, kind: SpotKind): Promise<number> {
  return insertSpot(db, kind, await locateHere());
}

export async function getSpot(db: SQLiteDatabase, id: number): Promise<Spot | null> {
  return db.getFirstAsync<Spot>(`${SELECT_SPOT} WHERE l.id = ?`, [id]);
}

const ACTIVE_WHERE = `l.type = 'parking' AND l.endedAt IS NULL
  AND (l.timestamp >= ? OR (s.isActive = 1 AND s.endTime > ?))`;
const activeArgs = (now: number) => [new Date(now - ACTIVE_PARKING_WINDOW_MS).toISOString(), now];

/** All active parkings, newest first. */
export async function getActiveParkings(db: SQLiteDatabase, now = Date.now()): Promise<Spot[]> {
  return db.getAllAsync<Spot>(`${SELECT_SPOT} WHERE ${ACTIVE_WHERE} ORDER BY l.timestamp DESC`, activeArgs(now));
}

/** The newest active parking (or null). */
export async function getActiveParking(db: SQLiteDatabase, now = Date.now()): Promise<Spot | null> {
  return (await getActiveParkings(db, now))[0] ?? null;
}

export async function countActiveParkings(db: SQLiteDatabase, now = Date.now()): Promise<number> {
  const r = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM locations l LEFT JOIN schedulers s ON s.locationId = l.id WHERE ${ACTIVE_WHERE}`,
    activeArgs(now),
  );
  return r?.n ?? 0;
}

export function isActiveParking(s: Spot, now = Date.now()): boolean {
  if (s.type !== "parking" || s.endedAt) return false;
  return new Date(s.timestamp).getTime() >= now - ACTIVE_PARKING_WINDOW_MS || hasActiveLimit(s, now);
}

export function isNewPlace(s: Spot, now = Date.now()): boolean {
  return s.type === "favorites" && !s.viewedAt && new Date(s.timestamp).getTime() >= now - NEW_PLACE_WINDOW_MS;
}

/** Opening a place's details ends its "New" mark. */
export async function markViewed(db: SQLiteDatabase, id: number): Promise<void> {
  const r = await db.runAsync("UPDATE locations SET viewedAt = ? WHERE id = ? AND viewedAt IS NULL", [Date.now(), id]);
  if (r.changes) bumpSpots();
}

export interface SpotDetails {
  title?: string | null;
  level?: string | null;
  section?: string | null;
  spot?: string | null;
  comments?: string | null;
}

export async function updateSpotDetails(db: SQLiteDatabase, id: number, d: SpotDetails): Promise<void> {
  const clean = (v?: string | null) => (v && v.trim() ? v.trim() : null);
  await db.runAsync(
    `UPDATE locations SET title = ?, level = ?, section = ?, spot = ?, comments = ?,
       levelSource = CASE WHEN ? IS NULL THEN NULL ELSE COALESCE(levelSource, 'manual') END
     WHERE id = ?`,
    [clean(d.title), clean(d.level), clean(d.section), clean(d.spot), clean(d.comments), clean(d.level), id],
  );
  bumpSpots();
}

/** Only level / zone / spot (the inline editor on Parked) — name and note stay as they are. */
export async function updateSpotLevel(
  db: SQLiteDatabase,
  id: number,
  d: { level?: string | null; section?: string | null; spot?: string | null },
): Promise<void> {
  const clean = (v?: string | null) => (v && v.trim() ? v.trim() : null);
  await db.runAsync(
    `UPDATE locations SET level = ?, section = ?, spot = ?,
       levelSource = CASE WHEN ? IS NULL THEN NULL ELSE COALESCE(levelSource, 'manual') END
     WHERE id = ?`,
    [clean(d.level), clean(d.section), clean(d.spot), clean(d.level), id],
  );
  bumpSpots();
}

export interface ListOptions {
  search?: string;
  type?: SpotKind | "all";
  limit: number;
  offset: number;
}

export async function listSpots(db: SQLiteDatabase, o: ListOptions): Promise<Spot[]> {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (o.type && o.type !== "all") {
    where.push("l.type = ?");
    args.push(o.type);
  }
  const q = o.search?.trim();
  if (q) {
    where.push(
      "(l.title LIKE ? OR l.street LIKE ? OR l.city LIKE ? OR l.level LIKE ? OR l.section LIKE ? OR l.spot LIKE ? OR l.comments LIKE ?)",
    );
    const like = `%${q}%`;
    args.push(like, like, like, like, like, like, like);
  }
  const sql = `${SELECT_SPOT} ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY l.timestamp DESC LIMIT ? OFFSET ?`;
  return db.getAllAsync<Spot>(sql, [...args, o.limit, o.offset]);
}

export async function deleteSpot(db: SQLiteDatabase, id: number): Promise<void> {
  await cancelParkingReminder(id).catch(() => undefined);
  await db.runAsync("DELETE FROM locations WHERE id = ?", [id]);
  bumpSpots();
}

/** "End parking". */
export async function endParking(db: SQLiteDatabase, id: number): Promise<void> {
  await stopReminder(db, id);
  await db.runAsync("UPDATE locations SET endedAt = ? WHERE id = ?", [Date.now(), id]);
  bumpSpots();
}

// ── Time limit / reminder ────────────────────────────────────────────────

/** Reminds at most N min before the end (Settings, default 15), but never in the past for short limits. */
export function remindBeforeFor(endsAt: number, now = Date.now(), before = getPrefs().remindBeforeMin): number {
  const minutesLeft = Math.floor((endsAt - now) / 60_000);
  return Math.max(1, Math.min(before ?? DEFAULT_REMIND_BEFORE_MIN, Math.floor(minutesLeft / 2)));
}

/** Sets (or replaces) the time limit of a parking spot. Returns whether a reminder was scheduled. */
export async function setTimeLimit(db: SQLiteDatabase, id: number, title: string, endsAt: number): Promise<boolean> {
  const now = Date.now();
  const durationMinutes = Math.max(1, Math.round((endsAt - now) / 60_000));
  const before = remindBeforeFor(endsAt, now);
  const existing = await db.getFirstAsync<{ id: number }>("SELECT id FROM schedulers WHERE locationId = ?", [id]);
  if (existing) {
    await db.runAsync(
      `UPDATE schedulers SET startTime = ?, durationMinutes = ?, endTime = ?, notifyBeforeMinutes = ?,
         notificationSent = 0, isActive = 1, updatedAt = ? WHERE id = ?`,
      [now, durationMinutes, endsAt, before, now, existing.id],
    );
  } else {
    await db.runAsync(
      `INSERT INTO schedulers (locationId, startTime, durationMinutes, endTime, notifyBeforeMinutes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, now, durationMinutes, endsAt, before, now, now],
    );
  }
  bumpSpots();
  return scheduleParkingReminder({ locationId: id, title, endsAt, remindBeforeMinutes: before });
}

/**
 * On every app start: schedules again every reminder that is still ahead (the
 * database is the truth). Covers what the native restore can't — e.g. reminders
 * from 1.x after the update to 2.0. Scheduling the same reminder twice is harmless.
 */
export async function resyncReminders(db: SQLiteDatabase, fallbackTitle: string, now = Date.now()): Promise<number> {
  const rows = await db.getAllAsync<Spot & { notifyBeforeMinutes: number | null }>(
    `${SELECT_SPOT} WHERE s.isActive = 1 AND s.endTime > ? AND l.endedAt IS NULL`,
    [now],
  );
  let n = 0;
  for (const s of rows) {
    const endsAt = s.reminderEndsAt!;
    const before = s.notifyBeforeMinutes ?? remindBeforeFor(endsAt, now);
    if (endsAt - before * 60_000 <= now) continue; // already reminded
    if (await scheduleParkingReminder({ locationId: s.id, title: spotName(s, fallbackTitle), endsAt, remindBeforeMinutes: before }).catch(() => false)) n++;
  }
  return n;
}

export async function stopReminder(db: SQLiteDatabase, id: number): Promise<void> {
  await cancelParkingReminder(id).catch(() => undefined);
  await db.runAsync("UPDATE schedulers SET isActive = 0, updatedAt = ? WHERE locationId = ?", [Date.now(), id]);
  bumpSpots();
}

// ── Display helpers ──────────────────────────────────────────────────────

export function spotAddress(s: Pick<Spot, "street" | "city">): string | null {
  return [s.street, s.city].filter(Boolean).join(", ") || null;
}

export function spotName(s: Spot, fallback: string): string {
  return s.title || spotAddress(s) || fallback;
}

export function hasActiveLimit(s: Spot, now = Date.now()): boolean {
  return !!s.reminderActive && !!s.reminderEndsAt && s.reminderEndsAt > now;
}
