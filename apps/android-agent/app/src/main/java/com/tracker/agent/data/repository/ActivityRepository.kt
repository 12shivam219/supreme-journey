package com.tracker.agent.data.repository

import android.content.Context
import com.tracker.agent.data.local.AppDatabase
import com.tracker.agent.data.local.AppSessionEntity
import com.tracker.agent.data.remote.AlertTelemetryRequest
import com.tracker.agent.data.remote.NetworkClient
import com.tracker.agent.data.remote.PairDeviceRequest
import com.tracker.agent.data.remote.ScreenTimeTelemetryRequest
import com.tracker.agent.data.remote.SessionTelemetryRequest
import com.tracker.agent.utils.PreferenceManager
import com.tracker.agent.utils.UsageStatsHelper
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class ActivityRepository(private val context: Context) {

    private val db = AppDatabase.getInstance(context)
    private val dao = db.appSessionDao()
    private val prefs = PreferenceManager(context)
    private val usageHelper = UsageStatsHelper(context)

    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    private val dateOnlyFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    suspend fun pairDevice(pairingCode: String, deviceName: String): Pair<Boolean, String> {
        return try {
            val api = NetworkClient.getApi(prefs.serverUrl)
            val res = api.pairDevice(PairDeviceRequest(pairingCode, deviceName))
            if (res.isSuccessful && res.body() != null) {
                val body = res.body()!!
                prefs.deviceToken = body.deviceToken
                prefs.deviceId = body.deviceId
                prefs.isSetupCompleted = true
                Pair(true, "Device paired successfully!")
            } else {
                Pair(false, "Invalid or expired pairing code.")
            }
        } catch (e: Exception) {
            Pair(false, "Connection error: ${e.localizedMessage}")
        }
    }

    suspend fun recordSession(session: AppSessionEntity): Long {
        return dao.insertSession(session)
    }

    suspend fun collectAndStoreRecentUsage() {
        if (!usageHelper.hasUsageAccessPermission() || prefs.isTrackingPaused) return

        val now = System.currentTimeMillis()
        val since = now - (20 * 60 * 1000) // Look back last 20 minutes
        val sessions = usageHelper.extractForegroundSessions(since, now)

        for (s in sessions) {
            dao.insertSession(s)
        }
    }

    suspend fun syncPendingSessions(): Boolean {
        val token = prefs.deviceToken ?: return false
        val authHeader = "Bearer $token"
        val api = NetworkClient.getApi(prefs.serverUrl)

        collectAndStoreRecentUsage()

        val pending = dao.getPendingSessions(50)
        if (pending.isEmpty()) {
            syncDailyScreenTime()
            return true
        }

        val syncedIds = mutableListOf<Long>()

        for (session in pending) {
            try {
                val startIso = isoFormat.format(Date(session.startTime))
                val endIso = isoFormat.format(Date(session.endTime ?: (session.startTime + session.durationSeconds * 1000)))

                val req = SessionTelemetryRequest(
                    appName = session.appName,
                    windowTitle = session.windowTitle,
                    startTime = startIso,
                    endTime = endIso,
                    durationSeconds = session.durationSeconds
                )

                val res = api.sendSession(authHeader, req)
                if (res.isSuccessful) {
                    syncedIds.add(session.id)
                }
            } catch (e: Exception) {
                break // Stop batch on network interruption, will retry next cycle
            }
        }

        if (syncedIds.isNotEmpty()) {
            dao.markSessionsSynced(syncedIds)
            syncDailyScreenTime()
            return true
        }

        return false
    }

    suspend fun syncDailyScreenTime() {
        val token = prefs.deviceToken ?: return
        val authHeader = "Bearer $token"
        val api = NetworkClient.getApi(prefs.serverUrl)

        val todayStart = usageHelper.getTodayStartEpochMs()
        val todaySessions = dao.getSessionsSince(todayStart)

        val appMinutes = mutableMapOf<String, Int>()
        var totalMinutes = 0

        for (s in todaySessions) {
            val mins = maxOf(1, s.durationSeconds / 60)
            appMinutes[s.appName] = (appMinutes[s.appName] ?: 0) + mins
            totalMinutes += mins
        }

        try {
            val req = ScreenTimeTelemetryRequest(
                date = dateOnlyFormat.format(Date()),
                totalMinutes = totalMinutes,
                byAppBreakdownJson = appMinutes
            )
            api.sendDailyScreenTime(authHeader, req)
        } catch (e: Exception) {
            // Ignored, will retry on next sync
        }
    }

    suspend fun logPauseAlert(reason: String) {
        val token = prefs.deviceToken ?: return
        try {
            val api = NetworkClient.getApi(prefs.serverUrl)
            api.sendAlert(
                "Bearer $token",
                AlertTelemetryRequest(
                    type = "TRACKING_PAUSED",
                    message = "Activity tracking paused on Android device: $reason"
                )
            )
        } catch (e: Exception) {
            // Logged
        }
    }

    suspend fun getTodaySessions(): List<AppSessionEntity> {
        val todayStart = usageHelper.getTodayStartEpochMs()
        return dao.getSessionsSince(todayStart)
    }
}
