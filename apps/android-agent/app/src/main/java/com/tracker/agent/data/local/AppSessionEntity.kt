package com.tracker.agent.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "app_sessions")
data class AppSessionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val packageName: String,
    val appName: String,
    val windowTitle: String?,
    val startTime: Long, // Epoch ms
    val endTime: Long?,  // Epoch ms
    val durationSeconds: Int,
    val isSynced: Boolean = false,
    val syncedAt: Long? = null
)
