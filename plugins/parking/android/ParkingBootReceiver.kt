package com.example.easyspot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Android deletes alarms on a phone restart and when the app is updated.
 * This brings the parking reminders back (ParkingAlarms.restoreAll) — no need
 * to open EasySpot. LOCKED_BOOT_COMPLETED = right after a restart, even before
 * the phone is unlocked (direct boot); BOOT_COMPLETED = after unlock (both are safe to run twice).
 * Also when the user turns on "Alarms & reminders" (exact time, mockup X3): reminders
 * that were set while it was off (inexact) are scheduled again — now exact. On Huawei it needs "App launch → Secondary launch"
 * (the Reminders screen asks for it).
 */
class ParkingBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            "android.intent.action.QUICKBOOT_POWERON",
            "com.htc.intent.action.QUICKBOOT_POWERON",
            "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED" -> {
                Log.d("ParkingBootReceiver", "restoring reminders after ${intent.action}")
                ParkingAlarms.restoreAll(context.applicationContext)
            }
        }
    }
}
