# 🛡️ Child Device Monitoring Setup & Usage Guide

Complete guide to set up device monitoring for your children using Tracker LifeOS.

---

## 📋 Overview

Tracker provides comprehensive device monitoring for both **Windows** (desktop) and **Android** (mobile) devices. Parents can monitor:
- ✅ Screen time tracking (per-app, daily/weekly)
- ✅ Application usage history (timestamps, duration)
- ✅ Real-time activity timeline
- ✅ Alerts for screen time limit breaches
- ✅ Weekly activity reports
- ✅ Device pairing/management

---

## 🚀 Step 1: Set Up Parent Account & Child Profile

### 1.1 Create Parent Account (First Time)
```
1. Go to http://localhost:5173 (or your Tracker URL)
2. Click "Get Started" or "Sign In / Register"
3. Choose "Sign Up" (Parent)
4. Fill in:
   - Full Name: Your name (e.g., "John Parent")
   - Email: Your email (e.g., parent@example.com)
   - Password: Strong password (e.g., "SecureParent123!")
   - Confirm Password: Repeat above
5. Click "Sign Up"
6. You'll be redirected to the Parent Dashboard
```

**Test Account Available:**
- Email: `admin@tracker.local`
- Password: `ParentSecurePassword123!`

### 1.2 Add Child Profile
```
1. From Parent Dashboard, click "Add Child Profile" (amber button)
2. Fill in child information:
   - Child's Name: (e.g., "Sam")
   - Email: Unique email (e.g., sam@tracker.local)
   - Password: Strong password (e.g., "ChildPass123!")
   - Age: Child's age in years (e.g., 12)
3. Click "Create Child Account"
4. Child profile now appears in the "Family Profiles & Devices" section
```

**What This Creates:**
- ✅ Child user account (role: child)
- ✅ Automatic family link (parent → child)
- ✅ Default screen time limit (240 minutes/day)
- ✅ Empty devices list (ready for pairing)

---

## 🔗 Step 2: Pair Child Device (Windows or Android)

### 2.1 Generate Pairing Code

**From Parent Dashboard:**
```
1. In "Family Profiles & Devices" section, find your child
2. Click "Pair New Device" (QR Code icon)
3. A modal opens showing:
   - "6-Digit Pairing Code" (e.g., ABC123)
   - QR Code image
   - Valid until timestamp
4. Keep this open for device pairing
```

**Pairing Code Details:**
- 6-digit alphanumeric code
- Valid for 15 minutes (expires automatically)
- One-time use only
- Can regenerate by clicking "Refresh Code"

### 2.2 Pair Windows Device

**Installation:**
```
1. Download Windows Agent installer from: 
   (Download link would be provided in production)
   
2. Run: TrackerAgentSetup.exe
3. Choose install location (default: C:\Program Files\TrackerAgent)
4. Agent installer will:
   - Copy application files
   - Register auto-start in Windows startup
   - Open pairing wizard automatically

```

**Pairing Wizard (Windows):**
```
1. After installation, pairing window opens automatically
2. Fill in:
   - Device Name: (e.g., "Sam's Laptop")
   - 6-Digit Pairing Code: (From parent dashboard)
3. Click "Pair Device"
4. Wait for confirmation: "Device paired successfully!"
5. Agent minimizes to system tray (bottom right)
```

**What You'll See:**
- System tray icon shows: "Tracker — Activity Monitor (Active)"
- Notification: "Device activity is monitored with parent visibility"
- Right-click tray icon for options:
  - "📊 View My Activity" (child can see their own usage)
  - "🔗 Pair Device" (pair another device)
  - "⏸️ Pause Tracking" (child can pause - parent gets alert)

### 2.3 Pair Android Device

**Installation:**
```
1. Download Tracker Android app from: 
   (Would be on Google Play Store in production)
   
2. Install app on Android device
3. App opens automatically after installation
```

**Pairing Process (Android):**
```
1. In app, tap "Pair Device" or scan QR code option
2. Either:
   - OPTION A: Scan QR code
     • Point camera at QR code from parent dashboard
     • App auto-fills pairing code
   
   - OPTION B: Manual entry
     • Tap "Manual Entry"
     • Type 6-digit code
     • Type device name (e.g., "Sam's Phone")

3. Tap "Pair Device"
4. Confirmation: "Device paired successfully!"
5. App starts collecting device activity:
   - App usage tracking
   - Screen time monitoring
   - Push notifications from parent
```

**What The App Tracks (Android):**
- Foreground app activity (what's in focus)
- Duration of each app session
- Daily screen time summary
- App-specific usage breakdown
- Real-time sync to backend every 5-10 minutes

---

## 📊 Step 3: Access Device Activity Dashboard

### 3.1 Parent Dashboard Navigation

**From Main Sidebar:**
```
Left sidebar → Family & Devices section
  ├── "Parent Dashboard" (Overview of all children)
  └── "Device Activity" (Detailed monitoring)
```

### 3.2 Parent Dashboard Overview

**Quick Metrics (Top Cards):**
```
┌─────────────────────────────────┐
│ Children Profiles: 2             │
│ Paired Devices: 3                │
│ Safety Status: Normal            │
└─────────────────────────────────┘
```

**Family Profiles & Devices:**
```
For each child, you see:
┌────────────────────────────┐
│ [S] Sam (Age: 12)          │
├────────────────────────────┤
│ Connected Devices:         │
│ • Sam's Laptop (Windows)   │
│   Last seen: 2:34 PM       │
│ • Sam's Phone (Android)    │
│   Last seen: 2:28 PM       │
├────────────────────────────┤
│ [Pair New Device] Button   │
└────────────────────────────┘
```

---

## 🕐 Step 4: Monitor Real-Time Activity

### 4.1 View Device Activity Tab

**Navigation:**
```
Left Sidebar → "Device Activity" button
```

**What You See:**
```
1. CHILD SELECTOR
   - Dropdown to choose which child to monitor
   
2. OVERVIEW SECTION
   - Total screen time today (hours:minutes)
   - Device list with status
   - Last activity timestamp
   
3. TIMELINE (Chronological Activity)
   - ⏰ 09:15 AM - Chrome - 23 min (Browsing)
   - ⏰ 09:38 AM - VS Code - 45 min (Coding)
   - ⏰ 10:23 AM - Discord - 12 min (Gaming)
   - ⏰ 10:35 AM - Minecraft - 1 hr 15 min (Gaming)
   
4. APP BREAKDOWN (Summary)
   - Gaming: 2 hr 30 min (40%)
   - Productivity: 2 hr 15 min (36%)
   - Communication: 45 min (12%)
   - Other: 30 min (8%)
```

### 4.2 Date Selection

**View Activity by Date:**
```
- Default: Today's data
- Click date picker to select specific day
- View historical data (up to 90 days)
- Example: View Saturday's activity, compare to weekday
```

### 4.3 Device Filter

**Filter by Specific Device:**
```
Dropdown: "All Devices" or select:
  - Sam's Laptop (Windows)
  - Sam's Phone (Android)
  
Useful for:
  - Checking which device was used most
  - Investigating specific device concerns
  - Monitoring school laptop vs personal phone
```

---

## ⚠️ Step 5: Screen Time Limits & Alerts

### 5.1 Set Screen Time Limits

**From Monitoring Dashboard or Child Profile:**
```
1. Click on child name
2. Look for "Screen Time Settings" section
3. Set daily limit (default: 240 minutes = 4 hours)
4. Optional: Set category limits:
   - Gaming: max 60 min/day
   - Social Media: max 45 min/day
   - Productivity: unlimited
5. Optional: Set day-specific limits:
   - Weekday: 180 min (3 hours)
   - Weekend: 300 min (5 hours)
6. Click "Save Settings"
```

**What Happens When Limit is Reached:**
- 🟡 WARNING at 80% (3.2 hours of 4 hour limit)
  - Alert appears on parent dashboard
  - Child gets notification on their device
  
- 🔴 CRITICAL at 100% (4 hours)
  - Alert escalated on parent dashboard
  - Child's new apps won't launch
  - Notification sent to parent email

### 5.2 View Alerts

**From Device Activity Dashboard:**
```
1. Look for "Alerts" section (if any active)
2. See list of triggered alerts:
   - Alert Type: "Screen Time Limit Warning (80%)"
   - Child: Sam
   - Device: Sam's Laptop
   - Time: Today at 2:45 PM
   - Status: [View Details] [Acknowledge]
3. Click "Acknowledge" to mark as read
```

**Alert Types:**
- ⚠️ Screen Time Warning (80%)
- 🚨 Screen Time Limit Reached (100%)
- 🆕 New App Detected (first-time app use)
- 📱 Device Offline (no connection for 30+ min)
- 🔄 Tracking Paused (child paused monitoring)

---

## 📈 Step 6: Weekly Reports & Analytics

### 6.1 Access Weekly Report

**From Device Activity Dashboard:**
```
1. Find "Weekly Report" button/tab
2. Select child: (dropdown)
3. Automatic display of last 7 days:
   - Total screen time by day
   - Trends (increasing/decreasing)
   - Most used apps
   - Average session duration
```

**Weekly Report Contents:**
```
WEEK OF: Aug 10 - Aug 16, 2026

DAY-BY-DAY BREAKDOWN:
│ Monday    │ 240 min │ ████████░░ │ Normal
│ Tuesday   │ 220 min │ ███████░░░ │ Normal  
│ Wednesday │ 280 min │ █████████░ │ High
│ Thursday  │ 260 min │ ████████░░ │ Normal
│ Friday    │ 310 min │ ██████████ │ LIMIT +
│ Saturday  │ 420 min │ ██████████ │ Relaxed (weekend)
│ Sunday    │ 380 min │ ██████████ │ Relaxed (weekend)

WEEKLY TOTALS:
- Total: 2,110 minutes (35.2 hours)
- Average/Day: 301.4 minutes (5 hours)
- Highest: Friday (310 min)
- Lowest: Tuesday (220 min)

TOP APPS:
1. Minecraft: 8 hrs 45 min
2. Discord: 4 hrs 20 min
3. YouTube: 3 hrs 15 min
4. Chrome: 2 hrs 30 min
5. VS Code: 16 hrs (coding practice)
```

### 6.2 Export Activity Report

**CSV Export:**
```
1. From Device Activity, click "Export CSV"
2. File downloads: "child_device_activity_2026-08-15.csv"
3. Columns include:
   - Timestamp
   - App Name
   - Session Duration
   - Device Name
   - Category
   - Etc.
4. Import into Excel/Sheets for deeper analysis
```

---

## 🔧 Step 7: Device Management & Pairing

### 7.1 View Paired Devices

**From Parent Dashboard:**
```
Each child card shows:
  Connected Devices:
  ├── Sam's Laptop (Windows) - Last seen 2:34 PM
  └── Sam's Phone (Android) - Last seen 2:28 PM
```

**Device Details Available:**
- Device name (user-assigned)
- Device type (Windows/Android)
- Device ID (unique identifier)
- Last activity timestamp
- Pairing date
- Current pairing status

### 7.2 Pair Additional Device

**For Same Child:**
```
1. From child card, click "Pair New Device"
2. Modal opens with new pairing code
3. Follow Windows or Android pairing process
4. Device automatically added to same child profile
```

**Supports Multiple Devices:**
- One child can have multiple devices
- All devices' activity pooled in monitoring dashboard
- Can filter by device individually

### 7.3 Unpair Device (Remove)

**From Device List:**
```
1. On child card, find device
2. Click [...] menu on device row
3. Select "Remove Device"
4. Confirmation: "Device will stop reporting activity"
5. Device removed (agent stops syncing)
```

---

## 📱 Step 8: Child Transparency & Controls

### 8.1 Child Can See Their Own Activity (Windows Agent)

**From Child's Perspective:**
```
Right-click system tray → "📊 View My Activity"
Shows:
├── Today's Screen Time: X hours
├── Top Apps Used: List
├── Session Timeline: What was opened when
└── Compare to Yesterday/This Week
```

**Purpose:**
- Children develop awareness of screen habits
- Self-regulation through transparency
- Educational opportunity

### 8.2 Child Can Pause Tracking (With Alert)

**From Child's Perspective:**
```
Right-click system tray → "⏸️ Pause Tracking"
What Happens:
├── System notification: "Tracker Paused"
├── Parent notification: Alert in dashboard
├── Duration: Tracks when pause started
└── Auto-resume: Can click to resume
```

**Parent Sees:**
```
Alert: "Child paused tracking from system tray menu"
- Child: Sam
- Device: Sam's Laptop  
- Time: 3:15 PM
- Duration: [Still paused] or [Duration: 5 minutes]
```

**Purpose:**
- Builds trust between parent and child
- Transparency about monitoring
- Parent can have conversation about why paused

---

## 🔔 Step 9: Notifications & Email Reports

### 9.1 Real-Time Alerts

**Desktop Notifications (Parent):**
```
- Screen Time Warning (80% of limit)
- Screen Time Limit Reached (100%)
- New App Detected
- Device Offline
- Tracking Paused by Child
```

**Mobile Notifications (Android Child):**
```
- Screen Time Warning (80%)
- Screen Time Limit Reached (100%)
- Daily Summary
- New App Alert
```

### 9.2 Daily Digest Email

**Auto-Generated Daily Report:**
```
Email sent each morning with:
├── Yesterday's Screen Time: X hours
├── Apps Used: Top 5 with duration
├── Alerts Triggered: List
├── Trends: ↑ or ↓ compared to week avg
├── Recommendations: Smart insights
└── Quick Links: Dashboard access
```

**Enable/Disable:**
```
Parent Settings → Email Preferences
□ Daily Digest (default: enabled)
□ Alert Emails (real-time: enabled)
□ Weekly Report (Sundays: enabled)
```

### 9.3 Weekly Summary Report

**Auto-Generated Weekly Report:**
```
Email sent Sunday evening with:
├── Weekly Total Screen Time
├── Day-by-day breakdown
├── App usage trends
├── Comparison to previous weeks
├── Achievements/Improvements
└── Recommendations for next week
```

---

## 🛡️ Step 10: Safety Features & Controls

### 10.1 Category-Based Limits

**Set Different Limits by App Type:**
```
Gaming: 60 min/day
├── Minecraft
├── Discord
├── Steam

Social Media: 45 min/day
├── Instagram
├── TikTok
├── Snapchat

Productivity: Unlimited
├── VS Code
├── Chrome (educational)
├── Docs

Other: 30 min/day
└── Everything else
```

### 10.2 Time-Based Rules

**Set Different Limits by Day/Time:**
```
Weekday (Mon-Fri):
├── Before 8 AM: Blocked
├── 8 AM - 3 PM: School time (limited)
├── 3 PM - 6 PM: Activity time (30 min)
├── 6 PM - 8 PM: Dinner (no devices)
├── 8 PM - 10 PM: Study (productive apps only)
└── After 10 PM: Blocked

Weekend:
├── 10 AM - 12 AM: Chores first
├── 12 PM - 6 PM: Free time (4 hours)
└── After 6 PM: Family time
```

### 10.3 Bedtime Mode

**Automatic Blocking:**
```
Set bedtime hours: 10 PM - 7 AM
Result:
├── No apps launch during bedtime
├── Exceptions: Phone calls, emergencies
├── Gentle notification: "Bedtime mode active"
└── Auto-disable at wake time
```

---

## 🔐 Step 11: Audit Logs & Compliance

### 11.1 View Access Logs

**What Parents Access:**
```
From Dashboard, click "Activity Logs"
Shows:
├── Date/Time: When accessed
├── Action: "Viewed monitoring dashboard"
├── Child: Which child profile viewed
├── IP Address: From where
└── Duration: How long viewed
```

**Compliance Use:**
- Court order verification
- Evidence preservation
- Access audit trail

### 11.2 Export for Records

**From Audit Logs:**
```
Click "Export Logs (CSV)"
Download contains:
├── All access events
├── Timestamps
├── Child names
├── IP addresses
└── Device info
```

---

## 🎯 Step 12: Best Practices & Tips

### For Healthy Monitoring:

1. **Have the Conversation**
   - Tell child about monitoring beforehand
   - Explain the "why" (safety, not spying)
   - Set clear expectations together

2. **Set Reasonable Limits**
   - Start with current usage as baseline
   - Gradually reduce if needed
   - Account for homework/coding time

3. **Review Reports Weekly**
   - Look for trends, not daily nitpicking
   - Use data to have conversations
   - Celebrate improvements

4. **Balance Trust & Safety**
   - Don't spy obsessively
   - Let child have privacy areas
   - Use alerts smartly (not constantly)

5. **Use Alerts Wisely**
   - Set limit warnings (80%), not micro-alerts
   - Disable less important alerts to reduce noise
   - Focus on real safety concerns

6. **Schedule Screen-Free Times**
   - Meals, bedtime, homework
   - Family activities
   - Outdoor time

7. **Lead by Example**
   - Monitor your own screen time
   - Model healthy device habits
   - Put phones away at dinner

---

## 🆘 Troubleshooting

### Agent Not Syncing

**Windows Agent:**
```
Issue: Device shows "Last seen 1 hour ago"
Fix:
  1. Right-click tray icon → "View My Activity"
  2. Should see recent activity
  3. If not, check internet connection
  4. Restart agent from tray menu
  5. Check backend server is running
```

**Android Agent:**
```
Issue: Phone not syncing activity
Fix:
  1. Check WiFi/mobile data is on
  2. Restart app (force stop → reopen)
  3. Check app has usage access permission:
     Settings → Apps → Tracker → Permissions → Usage Access
  4. Verify server URL in app settings
  5. Check backend is running on correct port
```

### Pairing Code Expired

```
Error: "Invalid or expired pairing code"
Fix:
  1. Parent dashboard → child card
  2. Click "Pair New Device"
  3. Click "Refresh Code" to generate new one
  4. Use new 6-digit code on device
```

### Can't See Child Activity

```
Error: No activity showing in dashboard
Fix:
  1. Verify device is paired (appears in child card)
  2. Check device agent is running:
     - Windows: Look for tray icon
     - Android: Check app is installed
  3. Verify backend API is running: npm run dev:backend
  4. Check permissions in agent settings
  5. Manually trigger sync (force refresh on device)
```

---

## 📞 Support

If you encounter issues:
1. Check backend logs: `npm run dev:backend`
2. Check browser console: F12
3. Verify database: `npm run prisma:status`
4. Check agent logs (Windows/Android)
5. Restart services if needed

---

## ✅ Checklist - First Time Setup

- [ ] Parent account created
- [ ] Child profile added
- [ ] Windows agent installed and paired (or Android)
- [ ] Device appears in Parent Dashboard
- [ ] Activity showing in Device Activity tab
- [ ] Screen time limits configured
- [ ] Email notifications enabled
- [ ] Child is aware of monitoring
- [ ] Test pause/resume on agent
- [ ] Review first daily report email

**All Done! You're ready to monitor your child's device activity.** 🎉
