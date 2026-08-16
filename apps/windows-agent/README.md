# Tracker Windows Background Agent (.NET 8)

A production-ready, transparent desktop activity monitoring agent for Windows 10/11 built in C# (.NET 8).

---

## Key Features

1. **Windows Background Service (`TrackerAgent.Service`)**:
   - Runs as a native Windows Service (`sc.exe create TrackerAgentService`).
   - Automatically starts on system boot and auto-restarts on crash.
   - Low CPU and memory footprint (< 30MB RAM).

2. **Real Win32 OS-Level Hooks (`TrackerAgent.Core/Native/Win32Api.cs`)**:
   - `GetForegroundWindow()`, `GetWindowText()`, and `GetWindowThreadProcessId()` to track active applications and window titles.
   - `GetLastInputInfo()` to detect user idle periods (no keyboard or mouse movement for > 5 minutes). Suppresses tracking during idle periods.

3. **Offline-First SQLite Queue (`LocalSessionQueue.cs`)**:
   - Buffers activity sessions locally in SQLite (`%ProgramData%\TrackerAgent\agent_cache.db`).
   - Syncs pending batches every 60 seconds over HTTPS to `POST /api/telemetry/sessions` using the child device token.
   - Computes daily aggregates and syncs to `POST /api/telemetry/screentime`.
   - Never loses data during network interruptions.

4. **Transparent System Tray Companion (`TrackerAgent.TrayApp`)**:
   - Always visible in the Windows taskbar notification area (shield icon).
   - **"View My Activity"**: Opens a local dashboard window showing the child their own tracked time and applications today.
   - **"Pause Tracking"**: Pauses activity logging and immediately dispatches a visible `TRACKING_PAUSED` safety alert to the parent dashboard.
   - **"Pair Device"**: 6-digit pairing code wizard.

5. **Inno Setup 6 Installer (`installer/TrackerAgentInstaller.iss`)**:
   - Installs binaries to `C:\Program Files\TrackerAgent`.
   - Configures Windows Service auto-start and failure restart policies.
   - Configures Registry run keys for user login startup.

---

## Build & Publishing Instructions

### 1. Build Binaries with .NET 8 SDK
```powershell
# Publish Service
dotnet publish src/TrackerAgent.Service/TrackerAgent.Service.csproj -c Release -r win-x64 --self-contained false

# Publish Tray App
dotnet publish src/TrackerAgent.TrayApp/TrackerAgent.TrayApp.csproj -c Release -r win-x64 --self-contained false
```

### 2. Manual Service Installation (for Development)
```powershell
# Register service (Run as Administrator)
sc.exe create TrackerAgentService binPath= "C:\path\to\TrackerAgent.Service.exe" start= auto
sc.exe failure TrackerAgentService reset= 86400 actions= restart/60000/restart/60000/restart/60000
sc.exe start TrackerAgentService
```

### 3. Generate Single-File Installer with Inno Setup
Compile `installer/TrackerAgentInstaller.iss` using Inno Setup 6 Compiler:
```powershell
iscc installer/TrackerAgentInstaller.iss
```
Outputs `installer/Output/TrackerAgentSetup.exe`.
