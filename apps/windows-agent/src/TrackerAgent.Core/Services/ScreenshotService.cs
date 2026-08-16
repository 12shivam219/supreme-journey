using System.Drawing;
using System.Drawing.Imaging;
using TrackerAgent.Core.Services;

namespace TrackerAgent.Core.Services;

public class ScreenshotService
{
    private readonly ConfigService _configService;
    private readonly HttpClient _httpClient;

    public ScreenshotService(ConfigService configService, HttpClient? httpClient = null)
    {
        _configService = configService;
        _httpClient = httpClient ?? new HttpClient();
    }

    /// <summary>
    /// Captures the primary screen into a JPEG byte array.
    /// </summary>
    public byte[]? CaptureScreen()
    {
        try
        {
            var bounds = System.Windows.Forms.Screen.PrimaryScreen?.Bounds ?? new Rectangle(0, 0, 1920, 1080);
            using var bitmap = new Bitmap(bounds.Width, bounds.Height);
            using var g = Graphics.FromImage(bitmap);
            g.CopyFromScreen(Point.Empty, Point.Empty, bounds.Size);

            using var ms = new MemoryStream();
            bitmap.Save(ms, ImageFormat.Jpeg);
            return ms.ToArray();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ScreenshotService] Capture error: {ex.Message}");
            return null;
        }
    }
}
