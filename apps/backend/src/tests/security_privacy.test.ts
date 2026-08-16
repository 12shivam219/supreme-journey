import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildServer } from '../index.js';
import { prisma } from '../config/db.js';
import { EncryptionService } from '../services/encryption.service.js';
import { RetentionCronService } from '../services/retention.service.js';

const app = buildServer();

beforeAll(async () => {
  await app.ready();
  await prisma.user.deleteMany({
    where: { email: 'privacy_parent@tracker.local' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: 'privacy_parent@tracker.local' },
  });
  await app.close();
  await prisma.$disconnect();
});

describe('Phase 8: Security Hardening & Child Privacy Protection Integration Tests', () => {
  let parentToken: string;
  let childId: string;
  let deviceId: string;

  it('1. Sets up Parent and Child profile for privacy tests', async () => {
    const regRes = await request(app.server)
      .post('/api/auth/register')
      .send({
        name: 'Privacy Parent',
        email: 'privacy_parent@tracker.local',
        password: 'Password1234!',
      });
    parentToken = regRes.body.accessToken;

    const childRes = await request(app.server)
      .post('/api/family/children')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        name: 'Riley',
        age: 9,
      });
    childId = childRes.body.id;

    // Create device
    const pairCodeRes = await request(app.server)
      .post(`/api/family/children/${childId}/pairing-code`)
      .set('Authorization', `Bearer ${parentToken}`);

    const pairRes = await request(app.server)
      .post('/api/family/devices/pair')
      .send({
        pairingCode: pairCodeRes.body.pairingCode,
        deviceName: "Riley's Tablet",
        type: 'android',
      });
    deviceId = pairRes.body.deviceId;
  });

  it('2. Encrypts journal entries at rest with AES-256-GCM', async () => {
    const rawSecretThought = 'My private diary thoughts: today I learned physics!';
    const entryRes = await request(app.server)
      .post('/api/journal')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        date: '2026-08-15',
        content: rawSecretThought,
      });

    expect(entryRes.status).toBe(200);
    expect(entryRes.body.content).toBe(rawSecretThought);

    // Direct database query: verify ciphertext is stored on disk
    const dbRecord = await prisma.journalEntry.findFirst({
      where: { content: { contains: ':' } },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.content).not.toBe(rawSecretThought);
    expect(dbRecord?.content.split(':').length).toBe(3); // iv:authTag:cipherHex

    // Verify EncryptionService round-trip
    const decrypted = EncryptionService.decrypt(dbRecord!.content);
    expect(decrypted).toBe(rawSecretThought);
  });

  it('3. Logs audit access when parent views timeline', async () => {
    const timelineRes = await request(app.server)
      .get(`/api/monitoring/timeline?childId=${childId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(timelineRes.status).toBe(200);

    const auditLogsRes = await request(app.server)
      .get('/api/family/audit-logs')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(auditLogsRes.status).toBe(200);
    expect(auditLogsRes.body.length).toBeGreaterThanOrEqual(1);
    expect(auditLogsRes.body[0].action).toBe('VIEW_TIMELINE');
  });

  it('4. Prunes old app sessions older than retention cutoff (Data Retention TTL)', async () => {
    // Create an old session (40 days ago) and a fresh session
    const oldDate = new Date();
    oldDate.setUTCDate(oldDate.getUTCDate() - 40);

    await prisma.appSession.create({
      data: {
        deviceId,
        appName: 'OldBrowser.exe',
        startTime: oldDate,
        endTime: oldDate,
        durationSeconds: 300,
      },
    });

    const freshDate = new Date();
    await prisma.appSession.create({
      data: {
        deviceId,
        appName: 'FreshBrowser.exe',
        startTime: freshDate,
        endTime: freshDate,
        durationSeconds: 300,
      },
    });

    // Run prune job (> 30 days)
    const prunedCount = await RetentionCronService.pruneOldAppSessions(30);
    expect(prunedCount).toBeGreaterThanOrEqual(1);

    const remainingOld = await prisma.appSession.findMany({
      where: { appName: 'OldBrowser.exe' },
    });
    expect(remainingOld.length).toBe(0);

    const remainingFresh = await prisma.appSession.findMany({
      where: { appName: 'FreshBrowser.exe' },
    });
    expect(remainingFresh.length).toBe(1);
  });

  it('5. Exports child data bundle and executes hard delete purge', async () => {
    const exportRes = await request(app.server)
      .get(`/api/family/children/${childId}/export`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(exportRes.status).toBe(200);
    expect(exportRes.body.exportMetadata.compliance).toContain('GDPR');
    expect(exportRes.body.childProfile.name).toBe('Riley');
    expect(exportRes.body.devices.length).toBe(1);

    // Hard delete child
    const deleteRes = await request(app.server)
      .delete(`/api/family/children/${childId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(deleteRes.status).toBe(200);

    const childInDb = await prisma.user.findUnique({
      where: { id: childId },
    });
    expect(childInDb).toBeNull();
  });
});
