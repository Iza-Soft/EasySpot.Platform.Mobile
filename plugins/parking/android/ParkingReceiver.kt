package com.example.easyspot

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat

class ParkingReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        try {
            val locationId = intent.getIntExtra("locationId", 0)
            val title = intent.getStringExtra("title") ?: "Parking spot"
            val type = intent.getStringExtra("type") ?: "parking_reminder"
            val remindBeforeMinutes = intent.getIntExtra("remindBeforeMinutes", 10)
            
            Log.d("ParkingReceiver", "📱 Received alarm for location $locationId")
            // Shown now → nothing to restore after a restart any more.
            if (type == "parking_reminder") ParkingAlarms.forget(context, locationId)
            // History (Reminders screen): due vs. came, and the phone's state right now.
            val plannedAt = intent.getLongExtra("plannedAt", 0L)
            if (plannedAt > 0) ParkingAlarms.logDelivery(context, locationId, title, type == "test", plannedAt)
            ParkingAlarms.createChannel(context)
            Log.d("ParkingReceiver", "⏰ Remind before minutes: $remindBeforeMinutes")
            
            // Отваряне на приложението
            // Opens THAT parking (or the Reminders screen for the test) — navigation/linking.ts.
            val openIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = android.net.Uri.parse(
                    if (type == "test") "easyspot://reminders" else "easyspot://spot/$locationId"
                )
                putExtra("locationId", locationId)
                putExtra("type", type)
                putExtra("title", title)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            
            val pendingIntent = PendingIntent.getActivity(
                context,
                locationId,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Създаване на нотификация
            val notification = NotificationCompat.Builder(context, ParkingAlarms.CHANNEL_ID)
                .setContentTitle(
                    if (type == "test") context.getString(R.string.notification_test_title)
                    else context.getString(R.string.notification_title)
                )
                .setContentText(
                    if (type == "test") context.getString(R.string.notification_test_body)
                    else context.getString(R.string.notification_body, title, remindBeforeMinutes)
                )
                .setSmallIcon(R.drawable.notification_icon)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .build()
            
            val notificationManager = context.getSystemService(NotificationManager::class.java)
            notificationManager.notify(locationId, notification)
            
            Log.d("ParkingReceiver", "✅ Notification shown for location $locationId")
            
        } catch (e: Exception) {
            Log.e("ParkingReceiver", "❌ Error: ${e.message}")
        }
    }
}