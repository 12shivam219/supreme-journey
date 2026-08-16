package com.tracker.agent.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface AppSessionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: AppSessionEntity): Long

    @Query("SELECT * FROM app_sessions WHERE isSynced = 0 ORDER BY id ASC LIMIT :limit")
    suspend fun getPendingSessions(limit: Int = 50): List<AppSessionEntity>

    @Query("UPDATE app_sessions SET isSynced = 1, syncedAt = :syncedAt WHERE id IN (:ids)")
    suspend fun markSessionsSynced(ids: List<Long>, syncedAt: Long = System.currentTimeMillis())

    @Query("SELECT * FROM app_sessions WHERE startTime >= :sinceEpochMs ORDER BY id DESC")
    suspend fun getSessionsSince(sinceEpochMs: Long): List<AppSessionEntity>

    @Query("DELETE FROM app_sessions WHERE isSynced = 1 AND startTime < :olderThanEpochMs")
    suspend fun pruneOldSyncedSessions(olderThanEpochMs: Long)
}
