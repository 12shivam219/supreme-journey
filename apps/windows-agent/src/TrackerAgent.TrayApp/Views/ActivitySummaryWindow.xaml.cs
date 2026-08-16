using System.Windows;
using TrackerAgent.Core.Storage;

namespace TrackerAgent.TrayApp.Views;

public partial class ActivitySummaryWindow : Window
{
    private readonly LocalSessionQueue _queue;

    public ActivitySummaryWindow(LocalSessionQueue queue)
    {
        InitializeComponent();
        _queue = queue;
        LoadTodayActivity();
    }

    private void LoadTodayActivity()
    {
        var sessions = _queue.GetTodaySessions();
        int totalSeconds = sessions.Sum(s => s.DurationSeconds);
        int hours = totalSeconds / 3600;
        int mins = (totalSeconds % 3600) / 60;

        TxtTotalTime.Text = $"{hours}h {mins:D2}m";
        TxtAppCount.Text = $"{sessions.Select(s => s.AppName).Distinct().Count()} Apps";

        var viewModels = sessions.Select(s => new
        {
            s.AppName,
            WindowTitle = string.IsNullOrEmpty(s.WindowTitle) ? "-" : s.WindowTitle,
            FormattedDuration = $"{s.DurationSeconds / 60}m {s.DurationSeconds % 60}s",
            FormattedTime = s.StartTime.ToLocalTime().ToString("t")
        }).ToList();

        LstSessions.ItemsSource = viewModels;
    }

    private void BtnClose_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }
}
