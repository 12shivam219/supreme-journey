namespace TrackerAgent.Core.Models;

public class ActivitySession
{
    public long Id { get; set; }
    public string AppName { get; set; } = string.Empty;
    public string? WindowTitle { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int DurationSeconds { get; set; }
    public bool IsSynced { get; set; }
    public DateTime? SyncedAt { get; set; }
}

public class AgentSettings
{
    public string ServerUrl { get; set; } = "http://localhost:3000";
    public string? DeviceToken { get; set; }
    public string? DeviceId { get; set; }
    public bool IsTrackingPaused { get; set; }
    public int IdleThresholdSeconds { get; set; } = 300; // 5 minutes
    public int SyncIntervalSeconds { get; set; } = 60;
    public bool EnableScreenshots { get; set; } = false;
    public int ScreenshotIntervalMinutes { get; set; } = 10;
}
