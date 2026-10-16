package com.example.easyspot

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

/**
 * Parking reminders — scheduling, plus a small saved list so they survive what
 * Android does to alarms:
 *  - a phone RESTART deletes every alarm,
 *  - an app UPDATE (Play / AppGallery) deletes the app's alarms.
 * ParkingBootReceiver calls restoreAll() after both. Saved in SharedPreferences
 * (no database access from Kotlin needed): id → title, reminder time, minutes before.
 * The list is in DEVICE-PROTECTED storage, so it can be read right after a restart,
 * before the phone is unlocked (e.g. Samsung's night auto-restart).
 */
object ParkingAlarms {
    private const val TAG = "ParkingAlarms"
    private const val PREFS = "easyspot_reminders"
    private const val LOG_PREFS = "easyspot_reminder_log"
    private const val LOG_MAX = 30
    const val CHANNEL_ID = "parking_channel"
    /** Request code of the test reminder — never a real spot id. */
    const val TEST_ID = 2_000_000_000

    /** Schedules (or replaces) the reminder of one parking and remembers it. true = exact. */
    fun schedule(context: Context, locationId: Int, title: String, reminderTime: Long, remindBeforeMinutes: Int): Boolean {
        val exact = setAlarm(context, reminderTime, reminderIntent(context, locationId, title, remindBeforeMinutes, reminderTime), openAppIntent(context, locationId))
        prefs(context).edit().putString(
            key(locationId),
            JSONObject()
                .put("title", title)
                .put("time", reminderTime)
                .put("before", remindBeforeMinutes)
                .toString()
        ).apply()
        return exact
    }

    fun scheduleTest(context: Context, seconds: Int): Boolean {
        createChannel(context)
        val at = System.currentTimeMillis() + seconds * 1000L
        val intent = Intent(context, ParkingReceiver::class.java).apply {
            putExtra("locationId", TEST_ID)
            putExtra("type", "test")
            putExtra("plannedAt", at)
        }
        val pi = PendingIntent.getBroadcast(context, TEST_ID, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        return setAlarm(context, at, pi, openAppIntent(context, TEST_ID))
    }

    fun cancel(context: Context, locationId: Int) {
        val pi = PendingIntent.getBroadcast(
            context, locationId, Intent(context, ParkingReceiver::class.java),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pi != null) {
            (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(pi)
            pi.cancel()
        }
        forget(context, locationId)
        // Already shown? Remove it too — no reminder for a deleted / ended parking.
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(locationId)
    }

    /** The reminder was shown (or cancelled) — nothing to restore any more. */
    fun forget(context: Context, locationId: Int) {
        prefs(context).edit().remove(key(locationId)).apply()
    }

    /**
     * After a restart / app update: every saved reminder is scheduled again.
     * Its time passed while the phone was off, but the paid time has NOT ended yet
     * → shown right away. Paid time already over → dropped.
     */
    fun restoreAll(context: Context) {
        createChannel(context)
        val now = System.currentTimeMillis()
        for ((k, v) in prefs(context).all) {
            try {
                val id = k.removePrefix("r_").toInt()
                val o = JSONObject(v as String)
                val title = o.getString("title")
                val time = o.getLong("time")
                val before = o.getInt("before")
                val endsAt = time + before * 60_000L
                when {
                    time > now -> schedule(context, id, title, time, before)
                    endsAt > now -> {
                        val minutesLeft = ((endsAt - now) / 60_000L).toInt().coerceAtLeast(1)
                        // In 2 s, through the same alarm + receiver, with the minutes that are really left.
                        // plannedAt stays the original time → the history shows it as late (the phone was off).
                        setAlarm(context, now + 2_000L, reminderIntent(context, id, title, minutesLeft, time), openAppIntent(context, id))
                    }
                    else -> forget(context, id)
                }
                Log.d(TAG, "restored reminder $id")
            } catch (e: Exception) {
                Log.e(TAG, "restore failed for $k: ${e.message}")
                prefs(context).edit().remove(k).apply()
            }
        }
    }

    /**
     * Exact alarm on the minute. Huawei delays SCHEDULE_EXACT_ALARM/setExact alarms
     * (seen in Hayya), so 2.0 keeps USE_EXACT_ALARM (granted on install, Android 13+)
     * and uses setAlarmClock — the one alarm type Doze and EMUI never postpone.
     * If exact alarms are not allowed (Android 12 with the toggle off) → inexact.
     */
    private fun setAlarm(context: Context, time: Long, pendingIntent: PendingIntent, showIntent: PendingIntent): Boolean {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
        if (canExact && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // showIntent = tap on the phone's "next alarm" (status bar, lock screen,
            // quick settings): opens EasySpot. 1.x passed the reminder itself here.
            alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(time, showIntent), pendingIntent)
        } else if (canExact) {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, time, pendingIntent)
        } else {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pendingIntent)
            Log.w(TAG, "⚠️ Exact alarms not allowed — scheduled inexact reminder")
        }
        return canExact
    }

    private fun reminderIntent(context: Context, locationId: Int, title: String, remindBeforeMinutes: Int, plannedAt: Long): PendingIntent {
        val intent = Intent(context, ParkingReceiver::class.java).apply {
            putExtra("locationId", locationId)
            putExtra("title", title)
            putExtra("type", "parking_reminder")
            putExtra("remindBeforeMinutes", remindBeforeMinutes)
            putExtra("plannedAt", plannedAt)
        }
        return PendingIntent.getBroadcast(context, locationId, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    /**
     * Tap on the "next alarm" shown by the phone → EasySpot on THAT parking
     * (easyspot://spot/<id>, test → easyspot://reminders; see navigation/linking.ts).
     * An Activity intent, so it can never fire the reminder itself.
     */
    private fun openAppIntent(context: Context, locationId: Int): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = android.net.Uri.parse(
                if (locationId == TEST_ID) "easyspot://reminders" else "easyspot://spot/$locationId"
            )
            putExtra("locationId", locationId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(context, locationId, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Parking Reminders", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Channel for parking time reminders"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    // ── History (Reminders screen, mockup W4): when each reminder was due and when it came ──

    /** Called by ParkingReceiver the moment a reminder arrives — also with the app closed and the phone locked. */
    fun logDelivery(context: Context, locationId: Int, title: String?, test: Boolean, plannedAt: Long) {
        try {
            val pm = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            val km = context.getSystemService(Context.KEYGUARD_SERVICE) as android.app.KeyguardManager
            val entry = JSONObject()
                .put("id", locationId)
                .put("title", title ?: "")
                .put("test", test)
                .put("plannedAt", plannedAt)
                .put("cameAt", System.currentTimeMillis())
                .put("screenOff", !pm.isInteractive)
                .put("locked", km.isKeyguardLocked)
                .put("powerSave", pm.isPowerSaveMode)
                .put("idle", Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && pm.isDeviceIdleMode)
            val old = JSONArray(logPrefs(context).getString("log", "[]"))
            val next = JSONArray().put(entry)
            for (i in 0 until minOf(old.length(), LOG_MAX - 1)) next.put(old.get(i))
            logPrefs(context).edit().putString("log", next.toString()).apply()
        } catch (e: Exception) {
            Log.e(TAG, "log failed: ${e.message}")
        }
    }

    /** Newest first, as JSON (max 30). */
    fun readLog(context: Context): String = logPrefs(context).getString("log", "[]") ?: "[]"

    fun clearLog(context: Context) {
        logPrefs(context).edit().remove("log").apply()
    }

    private fun logPrefs(context: Context) =
        (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) context.createDeviceProtectedStorageContext() else context)
            .getSharedPreferences(LOG_PREFS, Context.MODE_PRIVATE)

    private fun prefs(context: Context) =
        (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) context.createDeviceProtectedStorageContext() else context)
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private fun key(id: Int) = "r_$id"
}
