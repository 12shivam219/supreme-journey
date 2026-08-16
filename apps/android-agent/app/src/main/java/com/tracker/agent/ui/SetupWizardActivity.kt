package com.tracker.agent.ui

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import com.tracker.agent.data.repository.ActivityRepository
import com.tracker.agent.databinding.ActivitySetupWizardBinding
import com.tracker.agent.services.TrackerForegroundService
import com.tracker.agent.utils.PreferenceManager
import com.tracker.agent.utils.UsageStatsHelper
import com.tracker.agent.workers.TelemetrySyncWorker
import kotlinx.coroutines.launch

class SetupWizardActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySetupWizardBinding
    private lateinit var prefs: PreferenceManager
    private lateinit var usageHelper: UsageStatsHelper
    private lateinit var repository: ActivityRepository

    private val qrScanLauncher = registerForActivityResult(ScanContract()) { result ->
        if (result.contents != null) {
            val code = result.contents.trim()
            // If QR payload contains raw code or JSON
            val cleanCode = if (code.length > 6 && code.contains("\"pairingCode\":\"")) {
                code.substringAfter("\"pairingCode\":\"").substringBefore("\"")
            } else {
                code.take(6)
            }
            binding.etPairingCode.setText(cleanCode)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySetupWizardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = PreferenceManager(this)
        usageHelper = UsageStatsHelper(this)
        repository = ActivityRepository(this)

        binding.etServerUrl.setText(prefs.serverUrl)

        binding.btnScanQr.setOnClickListener {
            val options = ScanOptions().apply {
                setPrompt("Scan the Pairing QR code from your parent's dashboard")
                setBeepEnabled(true)
                setOrientationLocked(false)
            }
            qrScanLauncher.launch(options)
        }

        binding.btnGrantUsageAccess.setOnClickListener {
            usageHelper.openUsageAccessSettings()
        }

        binding.btnGrantAccessibility.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
        }

        binding.btnCompleteSetup.setOnClickListener {
            performPairing()
        }
    }

    override fun onResume() {
        super.onResume()
        updatePermissionButtonsState()
    }

    private fun updatePermissionButtonsState() {
        if (usageHelper.hasUsageAccessPermission()) {
            binding.btnGrantUsageAccess.text = "✓ Usage Access Granted"
            binding.btnGrantUsageAccess.isEnabled = false
        } else {
            binding.btnGrantUsageAccess.text = "Grant Usage Access"
            binding.btnGrantUsageAccess.isEnabled = true
        }
    }

    private fun performPairing() {
        val serverUrl = binding.etServerUrl.text.toString().trim()
        val code = binding.etPairingCode.text.toString().trim()

        if (code.length != 6) {
            binding.tvSetupError.text = "Please enter a valid 6-digit code."
            return
        }

        if (!usageHelper.hasUsageAccessPermission()) {
            binding.tvSetupError.text = "Please grant Usage Access permission first."
            return
        }

        prefs.serverUrl = serverUrl
        binding.btnCompleteSetup.isEnabled = false
        binding.btnCompleteSetup.text = "Linking..."

        val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}"

        lifecycleScope.launch {
            val (success, message) = repository.pairDevice(code, deviceName)
            if (success) {
                TrackerForegroundService.startService(applicationContext)
                TelemetrySyncWorker.schedulePeriodicSync(applicationContext)
                Toast.makeText(this@SetupWizardActivity, message, Toast.LENGTH_LONG).show()

                val intent = Intent(this@SetupWizardActivity, MainActivity::class.java)
                startActivity(intent)
                finish()
            } else {
                binding.tvSetupError.text = message
                binding.btnCompleteSetup.isEnabled = true
                binding.btnCompleteSetup.text = "Complete Setup & Link"
            }
        }
    }
}
