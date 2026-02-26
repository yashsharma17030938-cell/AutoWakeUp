package com.autowakeup.mobile

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object AlarmScheduler {
    private const val PREFS = "autowakeup_prefs"
    private const val KEY_TRIGGER = "trigger_ms"
    private const val KEY_WINDOW = "window_mins"
    private const val KEY_LABEL = "label"
    private const val REQUEST_CODE = 1207

    fun schedule(context: Context, triggerAtMillis: Long, windowMinutes: Int, label: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = pendingIntent(context)

        val trigger = triggerAtMillis.coerceAtLeast(System.currentTimeMillis() + 1000)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent)
        } else {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent)
        }

        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putLong(KEY_TRIGGER, trigger)
            .putInt(KEY_WINDOW, windowMinutes)
            .putString(KEY_LABEL, label)
            .apply()
    }

    fun cancel(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(pendingIntent(context))
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }

    fun rescheduleIfNeeded(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val trigger = prefs.getLong(KEY_TRIGGER, -1L)
        val window = prefs.getInt(KEY_WINDOW, 0)
        val label = prefs.getString(KEY_LABEL, "Wake alarm") ?: "Wake alarm"
        if (trigger <= 0L) return
        schedule(context, trigger, window, label)
    }

    fun getSummary(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val trigger = prefs.getLong(KEY_TRIGGER, -1L)
        if (trigger <= 0L) return "No native alarm"
        val window = prefs.getInt(KEY_WINDOW, 0)
        val label = prefs.getString(KEY_LABEL, "Wake alarm") ?: "Wake alarm"
        val df = SimpleDateFormat("EEE, MMM d • hh:mm a", Locale.getDefault())
        return "$label @ ${df.format(Date(trigger))} (window ±${window}m)"
    }

    private fun pendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java)
        return PendingIntent.getBroadcast(
            context,
            REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
