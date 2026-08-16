package com.tracker.agent.utils

import android.content.Context
import android.content.SharedPreferences

class PreferenceManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("tracker_agent_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_DEVICE_TOKEN = "device_token"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_IS_PAUSED = "is_tracking_paused"
        private const val KEY_IS_SETUP_COMPLETED = "is_setup_completed"
    }

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, "http://10.0.2.2:3000") ?: "http://10.0.2.2:3000"
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value).apply()

    var deviceToken: String?
        get() = prefs.getString(KEY_DEVICE_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_TOKEN, value).apply()

    var deviceId: String?
        get() = prefs.getString(KEY_DEVICE_ID, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value).apply()

    var isTrackingPaused: Boolean
        get() = prefs.getBoolean(KEY_IS_PAUSED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_PAUSED, value).apply()

    var isSetupCompleted: Boolean
        get() = prefs.getBoolean(KEY_IS_SETUP_COMPLETED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_SETUP_COMPLETED, value).apply()

    val isPaired: Boolean
        get() = !deviceToken.isNullOrBlank()
}
