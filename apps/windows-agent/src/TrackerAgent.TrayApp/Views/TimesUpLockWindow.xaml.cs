using System.Windows;

namespace TrackerAgent.TrayApp.Views;

public partial class TimesUpLockWindow : Window
{
    public TimesUpLockWindow()
    {
        InitializeComponent();
    }

    private void BtnAcknowledge_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }
}
