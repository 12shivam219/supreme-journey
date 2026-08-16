package com.tracker.agent.services

import android.accessibilityservice.AccessibilityService
import android.content.pm.PackageManager
import android.view.accessibility.AccessibilityEvent
import com.tracker.agent.data.local.AppSessionEntity
import com.tracker.agent.data.repository.ActivityRepository
import com.tracker.agent.utils.PreferenceManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

class TrackerAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private lateinit var repository: ActivityRepository
    private lateinit var prefs: PreferenceManager

    private var currentPackage: String? = null
    private var sessionStartTime: Long = 0

    override fun onCreate() {
        super.onCreate()
        repository = ActivityRepository(applicationContext)
        prefs = PreferenceManager(applicationContext)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        if (prefs.isTrackingPaused || !prefs.isPaired) return

        val pkgName = event.packageName?.toString() ?: return
        val className = event.className?.toString()

        // Ignore launcher and system UI switches
        if (pkgName == "com.android.systemui" || pkgName == packageName) return

        val now = System.currentTimeMillis()

        if (currentPackage != null && currentPackage != pkgName && sessionStartTime > 0) {
            val duration = ((now - sessionStartTime) / 1000).toInt()
            if (duration >= 2) {
                val appLabel = getAppName(currentPackage!!)
                serviceScope.launch {
                    repository.recordSession(
                        AppSessionEntity(
                            packageName = currentPackage!!,
                            appName = appLabel,
                            windowTitle = className,
                            startTime = sessionStartTime,
                            endTime = now,
                            durationSeconds = duration
                        )
                    )
                }
            }
        }

        currentPackage = pkgName
        sessionStartTime = now
    }

    private fun getAppName(packageName: String): String {
        return try {
            val pm = packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: PackageManager.NameNotFoundException) {
            packageName.substringAfterLast('.')
        }
    }

    override fun onInterrupt() {
        // Required callback
    }
}
