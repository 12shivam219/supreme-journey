using TrackerAgent.Core.Native;
using TrackerAgent.Core.Services;

namespace TrackerAgent.Service;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly TelemetrySyncService _syncService;
    private readonly ConfigService _configService;

    private DateTime _lastSyncTime = DateTime.UtcNow;

    public Worker(
        ILogger<Worker> logger,
        TelemetrySyncService syncService,
        ConfigService configService)
    {
        _logger = logger;
        _syncService = syncService;
        _configService = configService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TrackerAgent Background Service started at: {time}", DateTimeOffset.Now);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Foreground-window capture intentionally runs in the visible tray
                // companion's user session, never in this Session-0 service.
                if ((DateTime.UtcNow - _lastSyncTime).TotalSeconds >= _configService.Settings.SyncIntervalSeconds)
                {
                    await _syncService.SyncPendingSessionsAsync(stoppingToken);
                    _lastSyncTime = DateTime.UtcNow;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in TrackerAgent worker loop.");
            }

            await Task.Delay(1000, stoppingToken);
        }

        _logger.LogInformation("TrackerAgent Service stopping at: {time}", DateTimeOffset.Now);
    }
}
