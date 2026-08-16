using System.Drawing;
using System.Windows.Forms;
using TrackerAgent.Core.Native;
using TrackerAgent.Core.Services;
using TrackerAgent.Core.Storage;
using TrackerAgent.TrayApp.Views;

namespace TrackerAgent.TrayApp;

public class TrayApplicationContext : IDisposable
{
    private readonly NotifyIcon _notifyIcon;
    private readonly ConfigService _configService;
    private readonly LocalSessionQueue _queue;
    private readonly TelemetrySyncService _syncService;
    private readonly UserActivityTracker _activityTracker;
    private readonly System.Windows.Forms.Timer _activityTimer;
    private readonly System.Windows.Forms.Timer _syncTimer;

    private ActivitySummaryWindow? _summaryWindow;
    private PairingWindow? _pairingWindow;

    public TrayApplicationContext(ConfigService configService, LocalSessionQueue queue, TelemetrySyncService syncService, UserActivityTracker activityTracker)
    {
        _configService = configService;
        _queue = queue;
        _syncService = syncService;
        _activityTracker = activityTracker;
        _activityTimer = new System.Windows.Forms.Timer { Interval = 1000, Enabled = true };
        _activityTimer.Tick += (_, _) => _activityTracker.Tick();
        _syncTimer = new System.Windows.Forms.Timer { Interval = Math.Max(10, _configService.Settings.SyncIntervalSeconds) * 1000, Enabled = true };
        _syncTimer.Tick += async (_, _) => await _syncService.SyncPendingSessionsAsync();

        _syncService.OnEnforcementTriggered += (mode) =>
        {
            if (mode == "lock")
            {
                System.Windows.Application.Current?.Dispatcher?.Invoke(() =>
                {
                    var lockWin = new TimesUpLockWindow();
                    lockWin.Show();
                });
            }
        };

        _notifyIcon = new NotifyIcon
        {
            Icon = SystemIcons.Shield,
            Text = "Tracker — Activity Monitor (Active)",
            Visible = true
        };

        BuildContextMenu();
        _notifyIcon.DoubleClick += (s, e) => ShowActivitySummary();

        // If not paired yet, show pairing wizard on first launch
        if (string.IsNullOrEmpty(_configService.Settings.DeviceToken))
        {
            ShowPairingWizard();
        }
    }

    private void BuildContextMenu()
    {
        var contextMenu = new ContextMenuStrip();

        // 1. "View My Activity" (Child Transparency)
        var viewItem = new ToolStripMenuItem("📊 View My Activity", null, (s, e) => ShowActivitySummary())
        {
            Font = new Font(Control.DefaultFont, FontStyle.Bold)
        };
        contextMenu.Items.Add(viewItem);

        // 2. "Device Pairing"
        var pairItem = new ToolStripMenuItem("🔗 Pair Device", null, (s, e) => ShowPairingWizard());
        contextMenu.Items.Add(pairItem);

        contextMenu.Items.Add(new ToolStripSeparator());

        // 3. "Pause Tracking"
        bool isPaused = _configService.Settings.IsTrackingPaused;
        var pauseItem = new ToolStripMenuItem(isPaused ? "▶️ Resume Tracking" : "⏸️ Pause Tracking (Notifies Parent)", null, async (s, e) =>
        {
            bool newPausedState = !_configService.Settings.IsTrackingPaused;
            _configService.SetTrackingPaused(newPausedState);

            if (newPausedState)
            {
                await _syncService.LogTrackingPausedAlertAsync("Child paused tracking from system tray menu.");
                _notifyIcon.Text = "Tracker — Paused (Parent Notified)";
                _notifyIcon.ShowBalloonTip(3000, "Tracker Paused", "Activity tracking paused. Your parent has been notified.", ToolTipIcon.Warning);
            }
            else
            {
                _notifyIcon.Text = "Tracker — Activity Monitor (Active)";
                _notifyIcon.ShowBalloonTip(3000, "Tracker Resumed", "Activity tracking has resumed.", ToolTipIcon.Info);
            }

            BuildContextMenu();
        });
        contextMenu.Items.Add(pauseItem);

        contextMenu.Items.Add(new ToolStripSeparator());

        // Status Header
        string statusText = string.IsNullOrEmpty(_configService.Settings.DeviceToken) ? "Status: Unpaired" : "Status: Paired & Active";
        var statusItem = new ToolStripMenuItem(statusText) { Enabled = false };
        contextMenu.Items.Add(statusItem);

        _notifyIcon.ContextMenuStrip = contextMenu;
    }

    private void ShowActivitySummary()
    {
        if (_summaryWindow == null || !_summaryWindow.IsVisible)
        {
            _summaryWindow = new ActivitySummaryWindow(_queue);
            _summaryWindow.Show();
        }
        else
        {
            _summaryWindow.Activate();
        }
    }

    private void ShowPairingWizard()
    {
        if (_pairingWindow == null || !_pairingWindow.IsVisible)
        {
            _pairingWindow = new PairingWindow(_syncService, () =>
            {
                BuildContextMenu();
                _notifyIcon.ShowBalloonTip(3000, "Pairing Successful", "This device is now linked to your family account.", ToolTipIcon.Info);
            });
            _pairingWindow.Show();
        }
        else
        {
            _pairingWindow.Activate();
        }
    }

    public void Dispose()
    {
        _activityTracker.CommitCurrentSession();
        _activityTimer.Stop();
        _activityTimer.Dispose();
        _syncTimer.Stop();
        _syncTimer.Dispose();
        _notifyIcon.Visible = false;
        _notifyIcon.Dispose();
    }
}
