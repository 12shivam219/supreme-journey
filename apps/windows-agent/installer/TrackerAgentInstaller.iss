; Inno Setup 6 Installer Script for Tracker Windows Agent
#define MyAppName "Tracker Windows Agent"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Tracker Family Safety"
#define MyAppURL "https://tracker.family"
#define MyAppExeName "TrackerAgent.TrayApp.exe"

[Setup]
AppId={{D8158F2C-78FA-464A-B68C-D980C51F33F1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\TrackerAgent
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputBaseFilename=TrackerAgentSetup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Tray App Binaries
Source: "..\src\TrackerAgent.TrayApp\bin\Release\net8.0-windows\win-x64\publish\*"; DestDir: "{app}\TrayApp"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Tracker Activity"; Filename: "{app}\TrayApp\{#MyAppExeName}"
Name: "{autostartup}\TrackerAgentTray"; Filename: "{app}\TrayApp\{#MyAppExeName}"

[Run]
; Capture runs only in the visible signed-in user process. A Windows service
; cannot reliably access the interactive desktop and must not capture activity.
Filename: "{app}\TrayApp\{#MyAppExeName}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "taskkill.exe"; Parameters: "/F /IM {#MyAppExeName}"; Flags: runhidden

[Registry]
; Auto-start system tray on user login
Root: HKLM; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "TrackerAgentTray"; ValueData: """{app}\TrayApp\{#MyAppExeName}"""; Flags: uninsdeletevalue
