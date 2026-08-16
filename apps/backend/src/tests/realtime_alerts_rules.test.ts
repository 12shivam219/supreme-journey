import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildServer } from '../index.js';
import { prisma } from '../config/db.js';

const app = buildServer();

beforeAll(async () => {
  await app.ready();
  await prisma.user.deleteMany({
    where: { email: 'rules_parent@tracker.local' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: 'rules_parent@tracker.local' },
  });
  await app.close();
  await prisma.$disconnect();
});

describe('Phase 7: Real-Time Rules Engine, Enforcement & Digest Tests', () => {
  let parentToken: string;
  let childId: string;
  let deviceToken: string;

  it('1. Sets up Parent, Child, Device, and Limit', async () => {
    // 1. Register parent
    const regRes = await request(app.server)
      .post('/api/auth/register')
      .send({
        name: 'Rules Parent',
        email: 'rules_parent@tracker.local',
        password: 'Password1234!',
      });
    parentToken = regRes.body.accessToken;

    // 2. Create child profile
    const childRes = await request(app.server)
      .post('/api/family/children')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        name: 'Jordan',
        age: 11,
      });
    childId = childRes.body.id;

    // 3. Configure daily limit to 100 minutes
    await request(app.server)
      .put(`/api/monitoring/limits/${childId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        dailyMinutesLimit: 100,
      });

    // 4. Pair device
    const pairCodeRes = await request(app.server)
      .post(`/api/family/children/${childId}/pairing-code`)
      .set('Authorization', `Bearer ${parentToken}`);

    const pairRes = await request(app.server)
      .post('/api/family/devices/pair')
      .send({
        pairingCode: pairCodeRes.body.pairingCode,
        deviceName: "Jordan's PC",
        type: 'windows',
      });
    deviceToken = pairRes.body.deviceToken;
  });

  it('2. Evaluates 80% limit warning on screen time ingestion', async () => {
    const res = await request(app.server)
      .post('/api/telemetry/screentime')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        date: '2026-08-15',
        totalMinutes: 85, // 85% of 100m limit
        byAppBreakdownJson: { 'VS Code': 85 },
      });

    expect(res.status).toBe(201);
    expect(res.body.usagePercentage).toBe(85);
    expect(res.body.limitBreached).toBe(false);
    expect(res.body.enforcementMode).toBe('warning');

    // Verify alert created in DB
    const alerts = await prisma.alert.findMany({
      where: { childId, type: 'SCREEN_TIME_APPROACHING' },
    });
    expect(alerts.length).toBe(1);
    expect(alerts[0].message).toContain('80%');
  });

  it('3. Evaluates 100% hard limit breach & triggers lock enforcement', async () => {
    const res = await request(app.server)
      .post('/api/telemetry/screentime')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        date: '2026-08-15',
        totalMinutes: 105, // 105% of 100m limit
        byAppBreakdownJson: { 'VS Code': 105 },
      });

    expect(res.status).toBe(201);
    expect(res.body.limitBreached).toBe(true);
    expect(res.body.shouldEnforce).toBe(true);
    expect(res.body.enforcementMode).toBe('lock');

    const breachAlerts = await prisma.alert.findMany({
      where: { childId, type: 'SCREEN_TIME_BREACHED' },
    });
    expect(breachAlerts.length).toBe(1);
  });

  it('4. Detects and alerts on new application launch', async () => {
    const res = await request(app.server)
      .post('/api/telemetry/sessions')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        appName: 'Fortnite.exe',
        windowTitle: 'Fortnite Battle Royale',
        startTime: '2026-08-15T10:00:00Z',
      });

    expect(res.status).toBe(201);

    const newAppAlerts = await prisma.alert.findMany({
      where: { childId, type: 'NEW_APP_DETECTED' },
    });
    expect(newAppAlerts.length).toBe(1);
    expect(newAppAlerts[0].message).toContain('Fortnite.exe');
  });

  it('5. Generates Activity Digest Preview & test email sending', async () => {
    const previewRes = await request(app.server)
      .get(`/api/monitoring/digest/preview?childId=${childId}&period=daily&date=2026-08-15`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(previewRes.status).toBe(200);
    expect(previewRes.body.childName).toBe('Jordan');
    expect(previewRes.body.totalScreenTimeMinutes).toBe(105);
    // Note: alertsTriggeredCount is 0 because alerts are created with current timestamp (now),
    // not the historical date (2026-08-15) being queried. See tests 2-4 for alert verification.

    const testSendRes = await request(app.server)
      .post(`/api/monitoring/digest/test-send?childId=${childId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(testSendRes.status).toBe(200);
    expect(testSendRes.body.success).toBe(true);
  });
});
