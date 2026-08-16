using System.Text;
using System.Text.Json;
using TrackerAgent.Core.Models;
using TrackerAgent.Core.Storage;

namespace TrackerAgent.Core.Services;

public class TelemetrySyncService
{
    private readonly HttpClient _httpClient;
    private readonly ConfigService _configService;
    private readonly LocalSessionQueue _queue;

    public event Action<string>? OnEnforcementTriggered;

    public TelemetrySyncService(ConfigService configService, LocalSessionQueue queue, HttpClient? httpClient = null)
    {
        _configService = configService;
        _queue = queue;
        _httpClient = httpClient ?? new HttpClient();
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
    }

    /// <summary>
    /// Syncs pending local SQLite activity sessions to the Fastify backend over HTTPS.
    /// </summary>
    public async Task<bool> SyncPendingSessionsAsync(CancellationToken cancellationToken = default)
    {
        string? token = _configService.Settings.DeviceToken;
        string serverUrl = _configService.Settings.ServerUrl.TrimEnd('/');

        if (string.IsNullOrEmpty(token) || !IsAllowedServerUrl(serverUrl))
        {
            // Device is not paired yet
            return false;
        }

        var pending = _queue.GetPendingSessions(50);
        if (pending.Count == 0)
        {
            return true;
        }

        var syncedIds = new List<long>();

        foreach (var session in pending)
        {
            if (cancellationToken.IsCancellationRequested) break;

            try
            {
                var payload = new
                {
                    clientSessionId = $"{_configService.Settings.DeviceId}:{session.Id}",
                    appName = session.AppName,
                    startTime = session.StartTime.ToUniversalTime().ToString("O"),
                    endTime = (session.EndTime ?? session.StartTime.AddSeconds(session.DurationSeconds)).ToUniversalTime().ToString("O"),
                    durationSeconds = session.DurationSeconds
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, $"{serverUrl}/api/telemetry/sessions")
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
                };
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    syncedIds.Add(session.Id);
                    try
                    {
                        var respContent = await response.Content.ReadAsStringAsync(cancellationToken);
                        using var doc = JsonDocument.Parse(respContent);
                        if (doc.RootElement.TryGetProperty("shouldEnforce", out var enforceProp) && enforceProp.GetBoolean())
                        {
                            string mode = doc.RootElement.TryGetProperty("enforcementMode", out var modeProp) ? modeProp.GetString() ?? "warning" : "warning";
                            OnEnforcementTriggered?.Invoke(mode);
                        }
                    }
                    catch { }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TelemetrySyncService] Network sync error: {ex.Message}");
                break; // Break loop on connection failure to retry next cycle
            }
        }

        if (syncedIds.Count > 0)
        {
            _queue.MarkSessionsSynced(syncedIds);
            await SyncDailyScreenTimeAsync(cancellationToken);
            return true;
        }

        return false;
    }

    /// <summary>
    /// Computes today's aggregate app breakdown and sends to /api/telemetry/screentime.
    /// </summary>
    public async Task SyncDailyScreenTimeAsync(CancellationToken cancellationToken = default)
    {
        string? token = _configService.Settings.DeviceToken;
        string serverUrl = _configService.Settings.ServerUrl.TrimEnd('/');
        if (string.IsNullOrEmpty(token) || !IsAllowedServerUrl(serverUrl)) return;

        var todaySessions = _queue.GetTodaySessions();
        var appMinutes = new Dictionary<string, int>();
        int totalMinutes = 0;

        foreach (var session in todaySessions)
        {
            // Aggregate seconds before rounding so rapid app switches cannot
            // artificially add a minute per session.
            appMinutes[session.AppName] = (appMinutes.GetValueOrDefault(session.AppName, 0)) + session.DurationSeconds;
            totalMinutes += session.DurationSeconds;
        }

        try
        {
            var payload = new
            {
                date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                totalMinutes = totalMinutes / 60,
                byAppBreakdownJson = appMinutes.ToDictionary(pair => pair.Key, pair => pair.Value / 60)
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{serverUrl}/api/telemetry/screentime")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TelemetrySyncService] Daily screen time sync failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Sends a visible tracking pause event alert to the parent dashboard.
    /// </summary>
    public async Task LogTrackingPausedAlertAsync(string reason = "Child requested pause from system tray")
    {
        string? token = _configService.Settings.DeviceToken;
        string serverUrl = _configService.Settings.ServerUrl.TrimEnd('/');
        if (string.IsNullOrEmpty(token) || !IsAllowedServerUrl(serverUrl)) return;

        try
        {
            var payload = new
            {
                type = "TRACKING_PAUSED",
                message = $"Activity tracking paused on device: {reason}"
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{serverUrl}/api/telemetry/alerts")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            await _httpClient.SendAsync(request);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TelemetrySyncService] Error logging pause alert: {ex.Message}");
        }
    }

    /// <summary>
    /// Pair the device with backend using 6-digit pairing code.
    /// </summary>
    public async Task<(bool Success, string Message)> PairWithCodeAsync(string pairingCode, string deviceName)
    {
        string serverUrl = _configService.Settings.ServerUrl.TrimEnd('/');

        if (!IsAllowedServerUrl(serverUrl))
        {
            return (false, "Tracker requires HTTPS except when pairing with localhost during development.");
        }

        try
        {
            var payload = new
            {
                pairingCode,
                deviceName,
                type = "windows"
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{serverUrl}/api/family/devices/pair")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };

            var response = await _httpClient.SendAsync(request);
            string responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(responseBody);
                string deviceId = doc.RootElement.GetProperty("deviceId").GetString()!;
                string deviceToken = doc.RootElement.GetProperty("deviceToken").GetString()!;

                _configService.UpdateDeviceToken(deviceToken, deviceId);
                return (true, "Device paired successfully!");
            }

            return (false, "Invalid or expired pairing code.");
        }
        catch (Exception ex)
        {
            return (false, $"Pairing failed: {ex.Message}");
        }
    }

    private static bool IsAllowedServerUrl(string serverUrl)
    {
        if (!Uri.TryCreate(serverUrl, UriKind.Absolute, out var uri)) return false;
        return uri.Scheme == Uri.UriSchemeHttps ||
               (uri.Scheme == Uri.UriSchemeHttp && (uri.Host == "localhost" || uri.Host == "127.0.0.1" || uri.Host == "::1"));
    }
}
