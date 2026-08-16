package com.tracker.agent.utils

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.tracker.agent.data.local.AppSessionEntity
import java.util.Calendar

class UsageStatsHelper(private val context: Context) {

    private val usageStatsManager =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

    fun hasUsageAccessPermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun openUsageAccessSettings() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    fun getAppNameFromPackage(packageName: String): String {
        return try {
            val pm = context.packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: PackageManager.NameNotFoundException) {
            packageName.substringAfterLast('.')
        }
    }

    /**
     * Polls UsageEvents for foreground activity intervals between start and end time.
     */
    fun extractForegroundSessions(startTimeMs: Long, endTimeMs: Long): List<AppSessionEntity> {
        if (!hasUsageAccessPermission()) return emptyList()

        val events = usageStatsManager.queryEvents(startTimeMs, endTimeMs)
        val sessionList = mutableListOf<AppSessionEntity>()

        var currentPackage: String? = null
        var sessionStart: Long = 0
        val event = UsageEvents.Event()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)

            when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    // App brought to foreground
                    if (currentPackage != null && sessionStart > 0 && event.timeStamp > sessionStart) {
                        val duration = ((event.timeStamp - sessionStart) / 1000).toInt()
                        if (duration >= 2) {
                            sessionList.add(
                                AppSessionEntity(
                                    packageName = currentPackage,
                                    appName = getAppNameFromPackage(currentPackage),
                                    windowTitle = event.className,
                                    startTime = sessionStart,
                                    endTime = event.timeStamp,
                                    durationSeconds = duration
                                )
                            )
                        }
                    }
                    currentPackage = event.packageName
                    sessionStart = event.timeStamp
                }

                UsageEvents.Event.ACTIVITY_PAUSED, UsageEvents.Event.ACTIVITY_STOPPED -> {
                    if (currentPackage == event.packageName && sessionStart > 0) {
                        val duration = ((event.timeStamp - sessionStart) / 1000).toInt()
                        if (duration >= 2) {
                            sessionList.add(
                                AppSessionEntity(
                                    packageName = currentPackage,
                                    appName = getAppNameFromPackage(currentPackage),
                                    windowTitle = event.className,
                                    startTime = sessionStart,
                                    endTime = event.timeStamp,
                                    durationSeconds = duration
                                )
                            )
                        }
                        currentPackage = null
                        sessionStart = 0
                    }
                }
            }
        }

        return sessionList
    }

    fun getTodayStartEpochMs(): Long {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }
}
