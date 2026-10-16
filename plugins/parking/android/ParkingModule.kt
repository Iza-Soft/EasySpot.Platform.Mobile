package com.example.easyspot

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class ParkingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val context: ReactApplicationContext = reactContext
    
    override fun getName(): String {
        return "ParkingModule"
    }

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            createNotificationChannel()
            promise.resolve("ParkingModule initialized")
            Log.d("ParkingModule", "✅ Module initialized")
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", e.message)
            Log.e("ParkingModule", "❌ Init failed: ${e.message}")
        }
    }

    @ReactMethod
    fun scheduleReminder(
        locationId: Int,
        title: String,
        endTime: Double,
        remindBeforeMinutes: Int,
        promise: Promise
    ) {
        try {
            val endTimeMillis = endTime.toLong()
            val reminderTime = endTimeMillis - (remindBeforeMinutes * 60 * 1000)
            
            Log.d("ParkingModule", "Scheduling reminder for: ${java.util.Date(reminderTime)}")
            Log.d("ParkingModule", "⏰ Remind before: $remindBeforeMinutes minutes")
            
            if (reminderTime <= System.currentTimeMillis()) {
                promise.reject("INVALID_TIME", "Reminder time must be in the future")
                return
            }

            // Remembered too, so a restart / app update does not lose it (ParkingBootReceiver).
            val canExact = ParkingAlarms.schedule(context, locationId, title, reminderTime, remindBeforeMinutes)

            Log.d("ParkingModule", "✅ Reminder scheduled for location $locationId")
            promise.resolve(if (canExact) "exact" else "inexact")
            
        } catch (e: Exception) {
            Log.e("ParkingModule", "❌ Schedule failed: ${e.message}")
            promise.reject("SCHEDULE_ERROR", e.message)
        }
    }

    /** "Send a test reminder" (Reminders screen): the same alarm + receiver path, in N seconds. */
    @ReactMethod
    fun scheduleTestReminder(seconds: Int, promise: Promise) {
        try {
            val exact = ParkingAlarms.scheduleTest(context, seconds)
            promise.resolve(if (exact) "exact" else "inexact")
        } catch (e: Exception) {
            promise.reject("TEST_ERROR", e.message)
        }
    }

    /** History of delivered reminders (newest first, JSON). */
    @ReactMethod
    fun getReminderLog(promise: Promise) {
        try {
            promise.resolve(ParkingAlarms.readLog(context))
        } catch (e: Exception) {
            promise.reject("LOG_ERROR", e.message)
        }
    }

    @ReactMethod
    fun clearReminderLog(promise: Promise) {
        ParkingAlarms.clearLog(context)
        promise.resolve(true)
    }

    @ReactMethod
    fun cancelReminder(locationId: Int, promise: Promise) {
        try {
            ParkingAlarms.cancel(context, locationId)
            Log.d("ParkingModule", "✅ Reminder cancelled for location $locationId")
            promise.resolve("Reminder cancelled")
        } catch (e: Exception) {
            Log.e("ParkingModule", "❌ Cancel failed: ${e.message}")
            promise.reject("CANCEL_ERROR", e.message)
        }
    }

    @ReactMethod
    fun hasActiveReminder(locationId: Int, promise: Promise) {
        try {
            val intent = Intent(context, ParkingReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                locationId,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            
            promise.resolve(pendingIntent != null)
            
        } catch (e: Exception) {
            Log.e("ParkingModule", "❌ Check failed: ${e.message}")
            promise.reject("CHECK_ERROR", e.message)
        }
    }

    private fun createNotificationChannel() = ParkingAlarms.createChannel(context)
}
