# End-to-End Production Testing Guide

**Purpose**: Verify complete system functionality from account creation through data validation

---

## Pre-Test Setup

### Prerequisites
- ✅ All services running (backend, frontend, PostgreSQL)
- ✅ Fresh database (optional: run `npm run db:seed` for sample data)
- ✅ Frontend accessible at configured URL
- ✅ Browser console open for error checking (F12)
- ✅ Backend logs visible for real-time monitoring

### Test Environment
```bash
# Terminal 1: Backend
cd apps/backend
npm run dev

# Terminal 2: Frontend
cd apps/web
npm run dev

# Terminal 3: Database (if not running)
docker-compose up postgres -d
```

---

## Phase 1: User Registration & Authentication

### Test 1.1: Create Parent Account
**Expected**: Successfully register as parent user

```
1. Navigate to http://localhost:5173 (or configured URL)
2. Click "Get Started" or login area
3. Fill signup form:
   - Name: "Alex Parent"
   - Email: "alex.parent@test.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
4. Click "Sign Up"

✅ Expected Results:
- Redirect to dashboard
- Welcome message displayed
- User profile shows "Alex Parent"
- No errors in browser console
- Backend logs show successful registration
- Database: User created with role="parent"
```

### Test 1.2: Session Persistence
**Expected**: Refresh token keeps user logged in

```
1. After successful login, note the access token
2. Press F5 to refresh the page
3. Wait for page to load

✅ Expected Results:
- User remains logged in (no redirect to login)
- Dashboard data loaded automatically
- No auth errors in console
- Backend: Refresh token validated successfully
```

### Test 1.3: Logout & Re-login
**Expected**: Logout clears session, re-login works

```
1. From dashboard, click "Log Out" button
2. Should redirect to login screen
3. Login with same credentials:
   - Email: alex.parent@test.com
   - Password: SecurePass123!
4. Click "Sign In"

✅ Expected Results:
- Login successful
- Dashboard displayed
- User data loaded
- No errors in console
```

---

## Phase 2: Create Child Account

### Test 2.1: Add Child User
**Expected**: Create a child account linked to parent

```
1. From parent dashboard, click "Add Child" button
2. Fill child form:
   - Name: "Sam Child"
   - Email: "sam.child@test.com"
   - Password: "ChildPass123!"
   - Age: 12
3. Click "Create Child Account"

✅ Expected Results:
- Modal closes
- Child appears in "My Children" list on dashboard
- Sidebar shows child name in children section
- Database: 
  - User created with role="child"
  - FamilyLink created connecting parent → child
  - ScreenTimeLimit created for child
```

### Test 2.2: Verify Child Account Exists
**Expected**: Can login as child user

```
1. Logout from parent account
2. Login with child credentials:
   - Email: sam.child@test.com
   - Password: ChildPass123!
3. Click "Sign In"

✅ Expected Results:
- Child dashboard displays
- Personal tracking features visible
- Limited features (no parent monitoring)
- Data isolated to this child
```

---

## Phase 3: Device Pairing (Windows Agent)

### Test 3.1: Generate Pairing Code
**Expected**: Parent can generate QR code for device linking

```
1. Login as parent (Alex Parent)
2. Select child from sidebar: "Sam Child"
3. Click "Pair Device" or similar
4. Modal shows QR code and 6-digit code
5. Note the code (e.g., "ABC123")

✅ Expected Results:
- QR code displays correctly
- 6-digit code visible and copyable
- Modal has clear instructions
- Backend logs pairing code generation
```

### Test 3.2: Simulate Device Activity (Manual Testing)
**Expected**: Manually test device integration by creating activity records

Since actual Windows agent may not be running, we'll simulate:

```bash
# In Terminal, directly insert test device activity:
cd apps/backend

# Create test script test-device-activity.ts
```

Create file: `apps/backend/scripts/test-device-activity.ts`

```typescript
import { prisma } from '../src/config/db.js';

async function createTestActivity(childId: string) {
  // 1. Create device for child
  const device = await prisma.device.create({
    data: {
      childId,
      type: 'windows',
      deviceName: 'Test Laptop',
      deviceToken: 'test-token-' + Date.now(),
      lastSeen: new Date(),
    },
  });

  console.log('✅ Device created:', device.id);

  // 2. Create app sessions (simulating user activity)
  const sessions = await prisma.appSession.createMany({
    data: [
      {
        deviceId: device.id,
        appName: 'Google Chrome',
        windowTitle: 'YouTube - Watch Videos',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        durationSeconds: 30 * 60,
      },
      {
        deviceId: device.id,
        appName: 'Discord',
        windowTitle: 'Friends Chat',
        startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        durationSeconds: 30 * 60,
      },
      {
        deviceId: device.id,
        appName: 'Visual Studio Code',
        windowTitle: 'main.tsx - Tracker',
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        endTime: new Date(), // Still active
        durationSeconds: null,
      },
    ],
  });

  console.log('✅ Created', sessions.count, 'app sessions');

  // 3. Create screen time aggregate for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const screenTime = await prisma.screenTimeDaily.create({
    data: {
      deviceId: device.id,
      date: today,
      totalMinutes: 120, // 2 hours total today
      byAppBreakdownJson: JSON.stringify({
        'Google Chrome': 45,
        'Discord': 35,
        'Visual Studio Code': 40,
      }),
    },
  });

  console.log('✅ Screen time recorded:', screenTime.totalMinutes, 'minutes');

  // 4. Create some alerts
  const alertsCount = await prisma.alert.create({
    data: {
      childId,
      type: 'SCREEN_TIME_EXCEEDED',
      message: 'Child exceeded daily screen time limit by 30 minutes',
      triggeredAt: new Date(Date.now() - 30 * 60 * 1000),
      acknowledged: false,
    },
  });

  console.log('✅ Alert created:', alertsCount.id);

  return { device, sessions, screenTime };
}

async function main() {
  try {
    // Get parent
    const parent = await prisma.user.findUnique({
      where: { email: 'alex.parent@test.com' },
    });

    if (!parent) {
      console.error('❌ Parent not found. Please create parent account first.');
      return;
    }

    // Get child
    const child = await prisma.user.findUnique({
      where: { email: 'sam.child@test.com' },
    });

    if (!child) {
      console.error('❌ Child not found. Please create child account first.');
      return;
    }

    console.log('Creating test activity for child:', child.name);
    await createTestActivity(child.id);

    console.log('\n✅ Test activity created successfully!');
    console.log('   Parent can now view child activity in dashboard');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

Run it:
```bash
npm run build
npx ts-node scripts/test-device-activity.ts
```

---

## Phase 4: Monitor Dashboard Verification

### Test 4.1: Verify Device Listed
**Expected**: Parent dashboard shows paired device

```
1. Login as parent (Alex Parent)
2. Navigate to Parent Dashboard tab
3. Select child "Sam Child" from dropdown

✅ Expected Results:
- Device "Test Laptop" visible in devices list
- Status shows "Active" or "Last seen: [time]"
- Device type shows "Windows"
```

### Test 4.2: Verify Timeline/Activity
**Expected**: Activity timeline shows app sessions

```
1. Click "View Timeline" or similar for the device
2. Should show today's activity

✅ Expected Results:
- Timeline displays chronological app sessions:
  - Google Chrome: 30 minutes
  - Discord: 30 minutes
  - Visual Studio Code: 40 minutes (ongoing)
- Sessions show start/end times
- Total time: ~2 hours
- Color-coded by app/category
```

### Test 4.3: Verify Screen Time Report
**Expected**: Daily screen time aggregated correctly

```
1. From monitoring dashboard, view "Screen Time" section
2. Should show today's total and app breakdown

✅ Expected Results:
- Total: 120 minutes (2 hours)
- App breakdown visible:
  - Google Chrome: 45 min
  - Discord: 35 min
  - VS Code: 40 min
- Matches device activity total
- Chart/graph displays correctly
```

### Test 4.4: Verify Alerts
**Expected**: Alerts appear for rule violations

```
1. Navigate to "Alerts" section
2. Should show unacknowledged alerts

✅ Expected Results:
- Alert visible: "Child exceeded daily screen time limit by 30 minutes"
- Timestamp accurate
- Can mark as acknowledged
- Acknowledged alerts can be filtered/hidden
```

---

## Phase 5: Personal Tracking

### Test 5.1: Create Task as Child
**Expected**: Child can create and track tasks

```
1. Login as child (Sam Child)
2. Click "Tasks & Todos" tab
3. Click "Add Task" button
4. Fill form:
   - Title: "Finish Math Homework"
   - Description: "Chapters 5-7"
   - Due Date: Tomorrow
   - Priority: High
5. Click "Create Task"

✅ Expected Results:
- Task appears in task list
- Shows as "To Do" status
- Due date displays correctly
- Priority indicator visible
- Backend: Task created in database
```

### Test 5.2: Complete Task
**Expected**: Child can mark task complete

```
1. From task list, click on "Finish Math Homework" task
2. Click "Mark Complete" or checkbox
3. Confirm completion

✅ Expected Results:
- Task status changes to "Completed"
- UI shows completed state (strikethrough, etc.)
- Timestamp recorded
- Appears in "Completed Today" section
- Database: completedAt timestamp set
```

### Test 5.3: Create Habit as Child
**Expected**: Child can track habits

```
1. Click "Habits & Streaks" tab
2. Click "Add Habit" button
3. Fill form:
   - Name: "Morning Exercise"
   - Frequency: Daily
   - Target: 30 minutes
4. Click "Create"

✅ Expected Results:
- Habit appears in active habits list
- Shows current streak: 0 days
- Can mark today as complete
- Empty habit shows "Start your streak"
```

### Test 5.4: Log Mood
**Expected**: Child can log daily mood

```
1. Click "Today Focus" tab
2. Look for "Mood" section
3. Select mood (e.g., "Happy" = 7/10)
4. Add note: "Great day today!"
5. Click "Save"

✅ Expected Results:
- Mood recorded for today
- Shows emoji/rating
- Note saved
- Mood appears in history
- Database: Single entry per day enforced
```

### Test 5.5: Write Journal Entry
**Expected**: Child can journal privately

```
1. Click "Private Journal" tab
2. Click "New Entry" or today's date
3. Write entry: "Today was productive. Finished homework and exercised."
4. Click "Save"

✅ Expected Results:
- Entry saved for today
- Content visible in journal view
- One entry per day enforced
- Privacy note visible
- Timestamp recorded
```

---

## Phase 6: Parent Monitoring

### Test 6.1: View Child Summary
**Expected**: Parent sees aggregated child data

```
1. Login as parent (Alex Parent)
2. Navigate to Parent Dashboard
3. Select child "Sam Child"
4. View "Summary" or "Overview" section

✅ Expected Results:
- Tasks completed today: 1
- Habits tracked: 1
- Mood logged: 1
- Journal entries: 1
- Screen time: 120 minutes
- All data accurate and current
- Last update timestamp shown
```

### Test 6.2: View Weekly Report
**Expected**: Parent sees weekly trends

```
1. From monitoring dashboard, click "Weekly Report"
2. Should show last 7 days data

✅ Expected Results:
- Chart shows screen time trend
- Daily breakdown visible
- Average calculated correctly
- Highest usage day highlighted
- Category breakdown visible
```

### Test 6.3: Set Screen Time Limits
**Expected**: Parent can configure limits

```
1. From child settings, click "Screen Time Limits"
2. Set:
   - Daily Limit: 180 minutes (3 hours)
   - Category Limits:
     - Entertainment: 90 minutes
     - Education: 120 minutes
3. Click "Save"

✅ Expected Results:
- Limits saved successfully
- Configuration shows updated values
- Future alerts triggered when exceeded
- Database: ScreenTimeLimit updated
```

---

## Phase 7: Real-time Features

### Test 7.1: Real-time Notifications
**Expected**: Parent receives instant notifications

```
1. Parent logged in, watching timeline
2. Child starts new app on device
3. (Or simulate via API: create new AppSession)
4. Within 2 seconds, parent sees update

✅ Expected Results:
- New app session appears in timeline
- No page refresh needed
- Status updated instantly
- WebSocket connection active
- Backend logs socket events
```

### Test 7.2: Alert in Real-time
**Expected**: Alerts appear immediately

```
1. Parent watching monitoring dashboard
2. Child triggers new alert (e.g., app blocked)
3. Alert appears instantly

✅ Expected Results:
- Alert badge appears
- Notification shown
- Can dismiss or acknowledge
- Sound/visual indicator (if enabled)
```

---

## Phase 8: Data Export & Privacy

### Test 8.1: Export Personal Data (Child)
**Expected**: Child can export their data

```
1. Login as child (Sam Child)
2. Settings → "Export My Data"
3. Click "Download"

✅ Expected Results:
- ZIP file downloaded
- Contains all personal data:
  - Tasks
  - Habits & logs
  - Mood entries
  - Journal entries
  - Profile info
- File readable (JSON format)
```

### Test 8.2: Delete Account (Optional)
**Expected**: Account deletion removes personal data

```
1. Settings → "Delete Account"
2. Confirm password
3. Confirm deletion warning

✅ Expected Results:
- Account deleted
- User redirected to login
- Can't login with deleted account
- Personal data removed (respecting retention policy)
- Family links removed
- Audit log retained
```

---

## Phase 9: Error Handling

### Test 9.1: Network Error Handling
**Expected**: App handles network errors gracefully

```
1. While viewing dashboard, disconnect internet
2. Try to perform action (refresh, load data)
3. Reconnect internet

✅ Expected Results:
- Error message displayed (not raw stack trace)
- "Retry" button available
- Can retry when reconnected
- App doesn't crash
- Backend errors logged
```

### Test 9.2: Permission Denied
**Expected**: Access control properly enforced

```
1. Get token from child account
2. Try to access parent-only endpoint:
   POST /api/monitoring/overview?childId=[othersChild]
3. Send with child token

✅ Expected Results:
- 403 Forbidden response
- Error message: "Access denied"
- No sensitive data leaked
- Backend: Logged unauthorized attempt
```

### Test 9.3: Validation Error
**Expected**: Input validation catches bad data

```
1. Create task with empty title
2. Or invalid email format
3. Submit form

✅ Expected Results:
- Client-side validation triggers
- Clear error message displayed
- Form doesn't submit
- Field highlighted
- User can correct and retry
```

---

## Phase 10: Performance & Accessibility

### Test 10.1: Page Load Time
**Expected**: Dashboard loads quickly

```
1. Hard refresh dashboard (Ctrl+Shift+R)
2. Measure load time

✅ Expected Results:
- First paint: < 1.5s
- Interactive: < 3s
- All content visible: < 5s
- Chrome DevTools Performance tab shows good marks
```

### Test 10.2: Keyboard Navigation
**Expected**: Can use app without mouse

```
1. Press Tab to navigate through interface
2. Press Enter/Space to activate buttons
3. Use Arrow keys in modals
4. Press Escape to close modals

✅ Expected Results:
- Focus indicators visible
- All interactive elements reachable
- Logical tab order
- No keyboard traps
- Screen reader friendly (if tested)
```

### Test 10.3: Mobile Responsiveness
**Expected**: Works on mobile devices

```
1. Open DevTools (F12)
2. Select responsive design mode
3. Set to iPhone 12 (390x844)
4. Navigate through app

✅ Expected Results:
- Layout responsive
- Touch targets adequate (min 44x44px)
- No horizontal scrolling
- Forms usable on mobile
- Navigation accessible
```

---

## Data Validation Checklist

After completing all tests, verify data integrity:

```sql
-- Check all users created correctly
SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5;

-- Check family links established
SELECT * FROM family_links WHERE parent_id = 'parent-id';

-- Check device activity recorded
SELECT COUNT(*) as session_count FROM app_sessions WHERE device_id = 'device-id';

-- Check alerts triggered
SELECT * FROM alerts WHERE child_id = 'child-id' ORDER BY triggered_at DESC LIMIT 5;

-- Check user data (tasks, habits, moods, journals)
SELECT 
  (SELECT COUNT(*) FROM tasks WHERE user_id = 'child-id') as tasks,
  (SELECT COUNT(*) FROM habits WHERE user_id = 'child-id') as habits,
  (SELECT COUNT(*) FROM mood_logs WHERE user_id = 'child-id') as moods,
  (SELECT COUNT(*) FROM journal_entries WHERE user_id = 'child-id') as journals;

-- Check audit logs
SELECT COUNT(*) FROM audit_logs WHERE parent_id = 'parent-id';

-- Check indexes exist (important for performance)
SELECT indexname FROM pg_indexes WHERE tablename = 'app_sessions';
```

---

## Sign-off Checklist

- [ ] Phase 1: Authentication (login, logout, session persistence)
- [ ] Phase 2: Child account creation
- [ ] Phase 3: Device pairing simulation
- [ ] Phase 4: Dashboard displays correct data
- [ ] Phase 5: Personal tracking works end-to-end
- [ ] Phase 6: Parent monitoring works
- [ ] Phase 7: Real-time updates functional
- [ ] Phase 8: Data export works
- [ ] Phase 9: Error handling graceful
- [ ] Phase 10: Performance & accessibility meets standards
- [ ] Database integrity verified
- [ ] No console errors
- [ ] No backend errors in logs
- [ ] All features match requirements document

---

## Production Readiness Sign-Off

**Date**: August 15, 2026  
**Tester**: [Your Name]  
**System Status**: ✅ PRODUCTION READY

**Notes**:
[Add any observations, limitations, or follow-up items here]
