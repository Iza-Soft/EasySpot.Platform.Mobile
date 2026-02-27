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
            
            if (reminderTime <= System.currentTimeMillis()) {
                promise.reject("INVALID_TIME", "Reminder time must be in the future")
                return
            }

            val intent = Intent(context, ParkingReceiver::class.java).apply {
                putExtra("locationId", locationId)
                putExtra("title", title)
                putExtra("type", "parking_reminder")
                putExtra("reminderTime", reminderTime)
            }
            
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                locationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val alarmClockInfo = AlarmManager.AlarmClockInfo(reminderTime, pendingIntent)
                alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
                Log.d("ParkingModule", "✅ Set as AlarmClock (bypasses doze)")
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, reminderTime, pendingIntent)
            }
            
            Log.d("ParkingModule", "✅ Reminder scheduled for location $locationId")
            promise.resolve("Reminder scheduled")
            
        } catch (e: Exception) {
            Log.e("ParkingModule", "❌ Schedule failed: ${e.message}")
            promise.reject("SCHEDULE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun cancelReminder(locationId: Int, promise: Promise) {
        try {
            val intent = Intent(context, ParkingReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                locationId,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            
            if (pendingIntent != null) {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
                Log.d("ParkingModule", "✅ Reminder cancelled for location $locationId")
                promise.resolve("Reminder cancelled")
            } else {
                promise.resolve("No reminder found")
            }
            
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

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelId = "parking_channel"
            val channelName = "Parking Reminders"
            val importance = NotificationManager.IMPORTANCE_HIGH
            
            val channel = NotificationChannel(channelId, channelName, importance).apply {
                description = "Channel for parking time reminders"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            
            val notificationManager = context.getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
            
            Log.d("ParkingModule", "✅ Notification channel created")
        }
    }
}