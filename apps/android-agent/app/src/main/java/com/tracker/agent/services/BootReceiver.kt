package com.tracker.agent.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.tracker.agent.utils.PreferenceManager

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            val prefs = PreferenceManager(context)
            if (prefs.isPaired) {
                TrackerForegroundService.startService(context)
            }
        }
    }
}
