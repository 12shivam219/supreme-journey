package com.tracker.agent.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.tracker.agent.R
import com.tracker.agent.data.local.AppSessionEntity
import com.tracker.agent.data.repository.ActivityRepository
import com.tracker.agent.databinding.ActivityMainBinding
import com.tracker.agent.services.TrackerForegroundService
import com.tracker.agent.utils.PreferenceManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: PreferenceManager
    private lateinit var repository: ActivityRepository

    private val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = PreferenceManager(this)
        repository = ActivityRepository(this)

        if (!prefs.isPaired) {
            val intent = Intent(this, SetupWizardActivity::class.java)
            startActivity(intent)
            finish()
            return
        }

        binding.rvSessions.layoutManager = LinearLayoutManager(this)

        binding.btnPauseTracking.setOnClickListener {
            toggleTrackingPause()
        }

        binding.btnSyncNow.setOnClickListener {
            triggerManualSync()
        }

        refreshDashboard()
    }

    override fun onResume() {
        super.onResume()
        refreshDashboard()
    }

    private fun refreshDashboard() {
        val isPaused = prefs.isTrackingPaused
        binding.btnPauseTracking.text = if (isPaused) "Resume Tracking" else "Pause Tracking"
        binding.tvTrackingStatus.text = if (isPaused) "● Paused (Parent Notified)" else "● Active & Syncing with Family Account"
        binding.tvTrackingStatus.setTextColor(
            resources.getColor(if (isPaused) R.color.amber_primary else R.color.emerald_accent, theme)
        )

        lifecycleScope.launch {
            val sessions = repository.getTodaySessions()
            val totalSeconds = sessions.sumOf { it.durationSeconds }
            val hours = totalSeconds / 3600
            val mins = (totalSeconds % 3600) / 60
            binding.tvTotalScreenTime.text = "${hours}h ${String.format("%02d", mins)}m"

            binding.rvSessions.adapter = SessionAdapter(sessions)
        }
    }

    private fun toggleTrackingPause() {
        val newPausedState = !prefs.isTrackingPaused
        prefs.isTrackingPaused = newPausedState

        lifecycleScope.launch {
            if (newPausedState) {
                repository.logPauseAlert("Child paused tracking directly from the Android app.")
            }
            TrackerForegroundService.startService(applicationContext) // Updates notification text
            refreshDashboard()
        }
    }

    private fun triggerManualSync() {
        binding.btnSyncNow.isEnabled = false
        binding.btnSyncNow.text = "Syncing..."

        lifecycleScope.launch {
            val success = repository.syncPendingSessions()
            binding.btnSyncNow.isEnabled = true
            binding.btnSyncNow.text = "Sync Now"

            Toast.makeText(
                this@MainActivity,
                if (success) "Sync successful!" else "Sync failed. Will retry automatically.",
                Toast.LENGTH_SHORT
            ).show()

            refreshDashboard()
        }
    }

    inner class SessionAdapter(private val list: List<AppSessionEntity>) :
        RecyclerView.Adapter<SessionAdapter.ViewHolder>() {

        inner class ViewHolder(view: android.view.View) : RecyclerView.ViewHolder(view) {
            val tvApp: TextView = view.findViewById(android.R.id.text1)
            val tvDetails: TextView = view.findViewById(android.R.id.text2)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val v = LayoutInflater.from(parent.context)
                .inflate(android.R.layout.simple_list_item_2, parent, false)
            return ViewHolder(v)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val s = list[position]
            holder.tvApp.text = s.appName
            holder.tvApp.setTextColor(resources.getColor(R.color.text_primary, theme))
            holder.tvApp.textSize = 13f

            val mins = maxOf(1, s.durationSeconds / 60)
            val time = timeFormat.format(Date(s.startTime))
            holder.tvDetails.text = "${mins} mins • Started at $time ${if (s.isSynced) "✓ Synced" else "⏳ Queued"}"
            holder.tvDetails.setTextColor(resources.getColor(R.color.text_secondary, theme))
            holder.tvDetails.textSize = 11f
        }

        override fun getItemCount(): Int = list.size
    }
}
