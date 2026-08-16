using TrackerAgent.Core.Native;
using TrackerAgent.Core.Services;
using TrackerAgent.Core.Storage;
using TrackerAgent.Service;

IHost host = Host.CreateDefaultBuilder(args)
    .UseWindowsService(options =>
    {
        options.ServiceName = "TrackerAgentService";
    })
    .ConfigureServices(services =>
    {
        services.AddSingleton<ConfigService>();
        services.AddSingleton<LocalSessionQueue>();
        services.AddSingleton<TelemetrySyncService>();
        services.AddSingleton<UserActivityTracker>();
        services.AddSingleton<ScreenshotService>();
        services.AddHostedService<Worker>();
    })
    .Build();

host.Run();
