using TrackerAgent.Core.Native;
using TrackerAgent.Core.Services;
using TrackerAgent.Core.Storage;

namespace TrackerAgent.Core.Native;

public class UserActivityTracker
{
    private readonly ConfigService _configService;
    private readonly LocalSessionQueue _queue;

    private string _currentApp = string.Empty;
    private DateTime _sessionStartTime = DateTime.UtcNow;
    private bool _isUserIdle;

    public UserActivityTracker(ConfigService configService, LocalSessionQueue queue)
    {
        _configService = configService;
        _queue = queue;
    }

    /// <summary>
    /// Evaluates current active window and idle status. Invoked on every tick (e.g. every 1-2 seconds).
    /// </summary>
    public void Tick()
    {
        if (_configService.Settings.IsTrackingPaused)
        {
            CommitCurrentSession();
            return;
        }

        // 1. Check Idle Status
        uint idleMs = Win32Api.GetIdleTimeMs();
        uint idleThresholdMs = (uint)(_configService.Settings.IdleThresholdSeconds * 1000);

        if (idleMs >= idleThresholdMs)
        {
            if (!_isUserIdle)
            {
                // User transitioned from Active -> Idle
                _isUserIdle = true;
                CommitCurrentSession();
            }
            return; // Suppress tracking during idle state
        }
        else
        {
            if (_isUserIdle)
            {
                // User returned from Idle -> Active
                _isUserIdle = false;
                _sessionStartTime = DateTime.UtcNow;
            }
        }

        // 2. Poll Active Foreground Window
        var (appName, _) = Win32Api.GetActiveWindowInfo();

        if (string.IsNullOrEmpty(_currentApp))
        {
            _currentApp = appName;
            _sessionStartTime = DateTime.UtcNow;
            return;
        }

        // Detect window or app switch
        if (_currentApp != appName)
        {
            CommitCurrentSession();
            _currentApp = appName;
            _sessionStartTime = DateTime.UtcNow;
        }
    }

    public void CommitCurrentSession()
    {
        if (string.IsNullOrEmpty(_currentApp)) return;

        DateTime now = DateTime.UtcNow;
        int durationSeconds = (int)(now - _sessionStartTime).TotalSeconds;

        if (durationSeconds >= 2) // Ignore jitter (<2s)
        {
            _queue.EnqueueSession(_currentApp, null, _sessionStartTime, now, durationSeconds);
        }

        _sessionStartTime = now;
    }
}
