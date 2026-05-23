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
            Log.d("ParkingReceiver", "⏰ Remind before minutes: $remindBeforeMinutes")
            
            // Отваряне на приложението
            val openIntent = Intent(context, MainActivity::class.java).apply {
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
            val notification = NotificationCompat.Builder(context, "parking_channel")
                .setContentTitle("⏰ Your parking is expiring soon!")
                .setContentText("$title - $remindBeforeMinutes minutes left")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
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