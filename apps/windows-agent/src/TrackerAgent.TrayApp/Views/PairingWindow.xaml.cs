using System.Windows;
using System.Windows.Media;
using TrackerAgent.Core.Services;

namespace TrackerAgent.TrayApp.Views;

public partial class PairingWindow : Window
{
    private readonly TelemetrySyncService _syncService;
    private readonly Action _onPairingComplete;

    public PairingWindow(TelemetrySyncService syncService, Action onPairingComplete)
    {
        InitializeComponent();
        _syncService = syncService;
        _onPairingComplete = onPairingComplete;
        TxtDeviceName.Text = Environment.MachineName;
    }

    private async void BtnPair_Click(object sender, RoutedEventArgs e)
    {
        string code = TxtPairingCode.Text.Trim();
        string deviceName = TxtDeviceName.Text.Trim();

        if (string.IsNullOrEmpty(code) || code.Length != 6)
        {
            TxtStatus.Text = "Please enter a valid 6-digit pairing code.";
            TxtStatus.Foreground = new SolidColorBrush(System.Windows.Media.Color.FromRgb(239, 68, 68));
            return;
        }

        BtnPair.IsEnabled = false;
        BtnPair.Content = "Pairing...";
        TxtStatus.Text = "";

        var (success, message) = await _syncService.PairWithCodeAsync(code, deviceName);

        if (success)
        {
            TxtStatus.Text = message;
            TxtStatus.Foreground = new SolidColorBrush(System.Windows.Media.Color.FromRgb(16, 185, 129));
            _onPairingComplete();
            await Task.Delay(1000);
            Close();
        }
        else
        {
            TxtStatus.Text = message;
            TxtStatus.Foreground = new SolidColorBrush(System.Windows.Media.Color.FromRgb(239, 68, 68));
            BtnPair.IsEnabled = true;
            BtnPair.Content = "Pair Device";
        }
    }
}
