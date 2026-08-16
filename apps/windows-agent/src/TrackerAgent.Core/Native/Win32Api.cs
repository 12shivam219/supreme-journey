using System.Runtime.InteropServices;
using System.Text;

namespace TrackerAgent.Core.Native;

public static class Win32Api
{
    [StructLayout(LayoutKind.Sequential)]
    public struct LASTINPUTINFO
    {
        public uint cbSize;
        public uint dwTime;
    }

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    /// <summary>
    /// Returns the system idle duration in milliseconds using GetLastInputInfo.
    /// </summary>
    public static uint GetIdleTimeMs()
    {
        var lastInputInfo = new LASTINPUTINFO();
        lastInputInfo.cbSize = (uint)Marshal.SizeOf(lastInputInfo);

        if (GetLastInputInfo(ref lastInputInfo))
        {
            uint currentTick = (uint)Environment.TickCount;
            return currentTick - lastInputInfo.dwTime;
        }

        return 0;
    }

    /// <summary>
    /// Retrieves the title and process executable name of the active foreground window.
    /// </summary>
    public static (string AppName, string WindowTitle) GetActiveWindowInfo()
    {
        IntPtr hWnd = GetForegroundWindow();
        if (hWnd == IntPtr.Zero)
        {
            return ("Unknown", "Idle / Lock Screen");
        }

        // 1. Get window title
        int length = GetWindowTextLength(hWnd);
        var sb = new StringBuilder(length + 1);
        GetWindowText(hWnd, sb, sb.Capacity);
        string windowTitle = sb.ToString();

        // 2. Get process name
        string appName = "Unknown";
        GetWindowThreadProcessId(hWnd, out uint processId);

        if (processId > 0)
        {
            try
            {
                using var process = System.Diagnostics.Process.GetProcessById((int)processId);
                appName = process.ProcessName;
            }
            catch
            {
                appName = "System";
            }
        }

        return (appName, windowTitle);
    }
}
