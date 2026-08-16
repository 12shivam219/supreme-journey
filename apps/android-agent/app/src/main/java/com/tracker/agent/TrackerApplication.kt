package com.tracker.agent

import android.app.Application
import com.tracker.agent.services.TrackerForegroundService
import com.tracker.agent.utils.PreferenceManager
import com.tracker.agent.workers.TelemetrySyncWorker

class TrackerApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        val prefs = PreferenceManager(this)
        if (prefs.isPaired) {
            // Start transparent foreground service
            TrackerForegroundService.startService(this)
            // Schedule 15-minute WorkManager sync
            TelemetrySyncWorker.schedulePeriodicSync(this)
        }
    }
}
