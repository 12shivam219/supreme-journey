import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildServer } from '../index.js';
import { prisma } from '../config/db.js';

const app = buildServer();

beforeAll(async () => {
  await app.ready();
  // Clean up any test users
  await prisma.user.deleteMany({
    where: { email: 'monitor_parent@tracker.local' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: 'monitor_parent@tracker.local' },
  });
  await app.close();
  await prisma.$disconnect();
});

describe('Phase 4: Parent Monitoring Dashboard & Telemetry Integration Tests', () => {
  let parentToken: string;
  let childId: string;
  let deviceToken: string;
  let alertId: string;

  const todayStr = '2026-08-15';

  it('1. Sets up Parent, Child, and Paired Device', async () => {
    // 1. Register parent
    const regRes = await request(app.server)
      .post('/api/auth/register')
      .send({
        name: 'Monitoring Parent',
        email: 'monitor_parent@tracker.local',
        password: 'Password1234!',
      });

    expect(regRes.status).toBe(201);
    parentToken = regRes.body.accessToken;

    // 2. Create child profile
    const childRes = await request(app.server)
      .post('/api/family/children')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        name: 'Alex',
        age: 12,
        avatar: 'avatar_bear.png',
      });

    expect(childRes.status).toBe(201);
    childId = childRes.body.id;

    // 3. Generate pairing code
    const pairCodeRes = await request(app.server)
      .post(`/api/family/children/${childId}/pairing-code`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(pairCodeRes.status).toBe(200);
    const code = pairCodeRes.body.pairingCode;

    // 4. Pair device
    const pairDeviceRes = await request(app.server)
      .post('/api/family/devices/pair')
      .send({
        pairingCode: code,
        deviceName: "Alex's Laptop",
        type: 'windows',
      });

    expect(pairDeviceRes.status).toBe(201);
    deviceToken = pairDeviceRes.body.deviceToken;
  });

  describe('Agent Telemetry Ingestion', () => {
    it('ingests sessions, screen time aggregates, and alerts using device token', async () => {
      // 1. Ingest app session
      const sessionRes = await request(app.server)
        .post('/api/telemetry/sessions')
        .set('Authorization', `Bearer ${deviceToken}`)
        .send({
          appName: 'Visual Studio Code',
          windowTitle: 'Python Project - main.py',
          startTime: '2026-08-15T09:00:00Z',
          endTime: '2026-08-15T10:30:00Z',
          durationSeconds: 5400,
        });

      expect(sessionRes.status).toBe(201);
      expect(sessionRes.body.appName).toBe('Visual Studio Code');

      // 2. Ingest daily screen time breakdown
      const screenTimeRes = await request(app.server)
        .post('/api/telemetry/screentime')
        .set('Authorization', `Bearer ${deviceToken}`)
        .send({
          date: todayStr,
          totalMinutes: 185,
          byAppBreakdownJson: {
            'Visual Studio Code': 90,
            'Google Chrome': 65,
            Minecraft: 30,
          },
        });

      expect(screenTimeRes.status).toBe(201);
      expect(screenTimeRes.body.totalMinutes).toBe(185);

      // 3. Ingest safety alert
      const alertRes = await request(app.server)
        .post('/api/telemetry/alerts')
        .set('Authorization', `Bearer ${deviceToken}`)
        .send({
          type: 'SCREEN_TIME_WARNING',
          message: 'Alex has used 75% of daily allotted screen time.',
        });

      expect(alertRes.status).toBe(201);
      expect(alertRes.body.type).toBe('SCREEN_TIME_WARNING');
      alertId = alertRes.body.id;
    });

    it('rejects telemetry when device token is missing or invalid', async () => {
      const res = await request(app.server)
        .post('/api/telemetry/sessions')
        .send({
          appName: 'Minecraft',
          startTime: '2026-08-15T11:00:00Z',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Parent Monitoring Dashboard Endpoints', () => {
    it('fetches dashboard overview with top apps and device status', async () => {
      const res = await request(app.server)
        .get(`/api/monitoring/overview?childId=${childId}&date=${todayStr}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.childName).toBe('Alex');
      expect(res.body.totalScreenTimeMinutes).toBe(185);
      expect(res.body.topApps.length).toBeGreaterThanOrEqual(3);
      expect(res.body.topApps[0].appName).toBe('Visual Studio Code');
      expect(res.body.devices.length).toBe(1);
      expect(res.body.devices[0].isOnline).toBe(true);
      expect(res.body.recentAlert).not.toBeNull();
    });

    it('fetches chronological session timeline', async () => {
      const res = await request(app.server)
        .get(`/api/monitoring/timeline?childId=${childId}&date=${todayStr}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].appName).toBe('Visual Studio Code');
      expect(res.body[0].category).toBe('Education');
    });

    it('fetches 7-day weekly report with category breakdown', async () => {
      const res = await request(app.server)
        .get(`/api/monitoring/weekly?childId=${childId}&date=${todayStr}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalMinutesThisWeek).toBe(185);
      expect(res.body.dailyBreakdown.length).toBe(7);
      expect(res.body.categoryBreakdown.length).toBeGreaterThanOrEqual(1);
    });

    it('manages alerts and acknowledges them', async () => {
      const listRes = await request(app.server)
        .get(`/api/monitoring/alerts?childId=${childId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBeGreaterThanOrEqual(1);

      const ackRes = await request(app.server)
        .post(`/api/monitoring/alerts/${alertId}/ack`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(ackRes.status).toBe(200);
      expect(ackRes.body.acknowledged).toBe(true);
    });

    it('retrieves and updates screen time limits', async () => {
      const getLimitsRes = await request(app.server)
        .get(`/api/monitoring/limits/${childId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(getLimitsRes.status).toBe(200);
      expect(getLimitsRes.body.dailyMinutesLimit).toBe(240);

      const updateLimitsRes = await request(app.server)
        .put(`/api/monitoring/limits/${childId}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          dailyMinutesLimit: 180,
          categoryLimitsJson: {
            Gaming: 60,
            Entertainment: 45,
          },
        });

      expect(updateLimitsRes.status).toBe(200);
      expect(updateLimitsRes.body.dailyMinutesLimit).toBe(180);
      expect(updateLimitsRes.body.categoryLimitsJson.Gaming).toBe(60);
    });
  });
});
