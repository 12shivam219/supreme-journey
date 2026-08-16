using System.Text.Json;
using TrackerAgent.Core.Models;

namespace TrackerAgent.Core.Services;

public class ConfigService
{
    private readonly string _configFilePath;
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public AgentSettings Settings { get; private set; }

    public ConfigService(string? customBasePath = null)
    {
        string basePath = customBasePath ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "TrackerAgent"
        );

        Directory.CreateDirectory(basePath);
        _configFilePath = Path.Combine(basePath, "config.json");
        Settings = LoadSettings();
    }

    private AgentSettings LoadSettings()
    {
        try
        {
            if (File.Exists(_configFilePath))
            {
                string json = File.ReadAllText(_configFilePath);
                var settings = JsonSerializer.Deserialize<AgentSettings>(json);
                if (settings != null) return settings;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ConfigService] Error reading config: {ex.Message}");
        }

        var defaultSettings = new AgentSettings();
        SaveSettings(defaultSettings);
        return defaultSettings;
    }

    public void SaveSettings(AgentSettings settings)
    {
        try
        {
            string json = JsonSerializer.Serialize(settings, JsonOptions);
            File.WriteAllText(_configFilePath, json);
            Settings = settings;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ConfigService] Error saving config: {ex.Message}");
        }
    }

    public void UpdateDeviceToken(string deviceToken, string deviceId)
    {
        Settings.DeviceToken = deviceToken;
        Settings.DeviceId = deviceId;
        SaveSettings(Settings);
    }

    public void SetTrackingPaused(bool isPaused)
    {
        Settings.IsTrackingPaused = isPaused;
        SaveSettings(Settings);
    }
}
