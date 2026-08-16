using System.Windows;
using TrackerAgent.Core.Services;
using TrackerAgent.Core.Storage;
using TrackerAgent.Core.Native;

namespace TrackerAgent.TrayApp;

public partial class App : System.Windows.Application
{
    private TrayApplicationContext? _trayContext;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        var configService = new ConfigService();
        var queue = new LocalSessionQueue();
        var syncService = new TelemetrySyncService(configService, queue);
        var activityTracker = new UserActivityTracker(configService, queue);

        _trayContext = new TrayApplicationContext(configService, queue, syncService, activityTracker);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _trayContext?.Dispose();
        base.OnExit(e);
    }
}
