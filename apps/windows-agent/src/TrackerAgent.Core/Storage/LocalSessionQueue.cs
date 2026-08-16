using Microsoft.Data.Sqlite;
using TrackerAgent.Core.Models;

namespace TrackerAgent.Core.Storage;

public class LocalSessionQueue : IDisposable
{
    private readonly string _connectionString;
    private readonly object _lock = new();

    public LocalSessionQueue(string? customDbPath = null)
    {
        string dbPath = customDbPath ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "TrackerAgent",
            "agent_cache.db"
        );

        string? dir = Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrEmpty(dir))
        {
            Directory.CreateDirectory(dir);
        }

        _connectionString = $"Data Source={dbPath}";
        InitializeDatabase();
    }

    private void InitializeDatabase()
    {
        lock (_lock)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            string createTableSql = @"
                CREATE TABLE IF NOT EXISTS ActivitySessions (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    AppName TEXT NOT NULL,
                    WindowTitle TEXT,
                    StartTime TEXT NOT NULL,
                    EndTime TEXT,
                    DurationSeconds INTEGER NOT NULL,
                    IsSynced INTEGER NOT NULL DEFAULT 0,
                    SyncedAt TEXT
                );
                CREATE INDEX IF NOT EXISTS IX_ActivitySessions_IsSynced ON ActivitySessions(IsSynced);
            ";

            using var cmd = new SqliteCommand(createTableSql, connection);
            cmd.ExecuteNonQuery();
        }
    }

    public void EnqueueSession(string appName, string? windowTitle, DateTime startTime, DateTime endTime, int durationSeconds)
    {
        if (durationSeconds <= 0) return;

        lock (_lock)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            string sql = @"
                INSERT INTO ActivitySessions (AppName, WindowTitle, StartTime, EndTime, DurationSeconds, IsSynced)
                VALUES (@AppName, @WindowTitle, @StartTime, @EndTime, @DurationSeconds, 0);
            ";

            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@AppName", appName);
            cmd.Parameters.AddWithValue("@WindowTitle", (object?)windowTitle ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@StartTime", startTime.ToUniversalTime().ToString("O"));
            cmd.Parameters.AddWithValue("@EndTime", endTime.ToUniversalTime().ToString("O"));
            cmd.Parameters.AddWithValue("@DurationSeconds", durationSeconds);
            cmd.ExecuteNonQuery();
        }
    }

    public List<ActivitySession> GetPendingSessions(int limit = 100)
    {
        lock (_lock)
        {
            var list = new List<ActivitySession>();
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            string sql = @"
                SELECT Id, AppName, WindowTitle, StartTime, EndTime, DurationSeconds, IsSynced, SyncedAt
                FROM ActivitySessions
                WHERE IsSynced = 0
                ORDER BY Id ASC
                LIMIT @Limit;
            ";

            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@Limit", limit);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new ActivitySession
                {
                    Id = reader.GetInt64(0),
                    AppName = reader.GetString(1),
                    WindowTitle = reader.IsDBNull(2) ? null : reader.GetString(2),
                    StartTime = DateTime.Parse(reader.GetString(3)),
                    EndTime = reader.IsDBNull(4) ? null : DateTime.Parse(reader.GetString(4)),
                    DurationSeconds = reader.GetInt32(5),
                    IsSynced = reader.GetInt32(6) == 1,
                    SyncedAt = reader.IsDBNull(7) ? null : DateTime.Parse(reader.GetString(7))
                });
            }

            return list;
        }
    }

    public void MarkSessionsSynced(IEnumerable<long> sessionIds)
    {
        lock (_lock)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            using var transaction = connection.BeginTransaction();
            string sql = "UPDATE ActivitySessions SET IsSynced = 1, SyncedAt = @SyncedAt WHERE Id = @Id;";

            foreach (long id in sessionIds)
            {
                using var cmd = new SqliteCommand(sql, connection, transaction);
                cmd.Parameters.AddWithValue("@SyncedAt", DateTime.UtcNow.ToString("O"));
                cmd.Parameters.AddWithValue("@Id", id);
                cmd.ExecuteNonQuery();
            }

            transaction.Commit();
        }
    }

    public List<ActivitySession> GetTodaySessions()
    {
        lock (_lock)
        {
            var list = new List<ActivitySession>();
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            DateTime todayUtc = DateTime.UtcNow.Date;
            string sql = @"
                SELECT Id, AppName, WindowTitle, StartTime, EndTime, DurationSeconds, IsSynced, SyncedAt
                FROM ActivitySessions
                WHERE StartTime >= @Today
                ORDER BY Id DESC;
            ";

            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@Today", todayUtc.ToString("O"));

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new ActivitySession
                {
                    Id = reader.GetInt64(0),
                    AppName = reader.GetString(1),
                    WindowTitle = reader.IsDBNull(2) ? null : reader.GetString(2),
                    StartTime = DateTime.Parse(reader.GetString(3)),
                    EndTime = reader.IsDBNull(4) ? null : DateTime.Parse(reader.GetString(4)),
                    DurationSeconds = reader.GetInt32(5),
                    IsSynced = reader.GetInt32(6) == 1,
                    SyncedAt = reader.IsDBNull(7) ? null : DateTime.Parse(reader.GetString(7))
                });
            }

            return list;
        }
    }

    public void Dispose()
    {
        // Cleanup if needed
    }
}
