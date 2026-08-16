package com.tracker.agent.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.tracker.agent.R
import com.tracker.agent.data.repository.ActivityRepository
import com.tracker.agent.ui.MainActivity
import com.tracker.agent.utils.PreferenceManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class TrackerForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var pollingJob: Job? = null

    companion object {
        const val CHANNEL_ID = "tracker_transparency_channel"
        const val NOTIFICATION_ID = 1001

        fun startService(context: Context) {
            val intent = Intent(context, TrackerForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, TrackerForegroundService::class.java)
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildTransparencyNotification())
        startPeriodicPolling()
    }

    private fun startPeriodicPolling() {
        val repo = ActivityRepository(applicationContext)
        val prefs = PreferenceManager(applicationContext)

        pollingJob?.cancel()
        pollingJob = serviceScope.launch {
            while (isActive) {
                if (!prefs.isTrackingPaused && prefs.isPaired) {
                    repo.collectAndStoreRecentUsage()
                }
                delay(60_000) // Poll usage state every minute
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Activity Transparency Disclosure",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Discloses to the child that device activity is actively monitored by parents."
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildTransparencyNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val prefs = PreferenceManager(applicationContext)
        val isPaused = prefs.isTrackingPaused

        val title = if (isPaused) "Tracker is Paused" else "Tracker is Active"
        val text = if (isPaused) "Monitoring paused. Your parent has been alerted." else "Device activity is monitored with parent visibility."

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        pollingJob?.cancel()
        super.onDestroy()
    }
}
