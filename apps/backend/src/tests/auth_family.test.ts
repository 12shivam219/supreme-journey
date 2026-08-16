import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildServer } from '../index.js';
import { prisma } from '../config/db.js';

const app = buildServer();

beforeAll(async () => {
  await app.ready();
  // Clean up any test users
  await prisma.user.deleteMany({
    where: { email: { in: ['testparent@tracker.local', 'childtest@tracker.local'] } },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: ['testparent@tracker.local', 'childtest@tracker.local'] } },
  });
  await app.close();
  await prisma.$disconnect();
});

describe('Phase 2 Full Authentication & Family Management Integration Tests', () => {
  let parentToken: string;
  let refreshTokenCookie: string;
  let childId: string;
  let pairingCode: string;

  it('1. Registers a new parent account with hashed password', async () => {
    const res = await request(app.server)
      .post('/api/auth/register')
      .send({
        name: 'Test Parent',
        email: 'testparent@tracker.local',
        password: 'SecurePassword123!',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe('testparent@tracker.local');
    expect(res.body.user.role).toBe('parent');

    parentToken = res.body.accessToken;
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    refreshTokenCookie = cookies[0];
  });

  it('2. Enforces parent-only route protection', async () => {
    const unauthorizedRes = await request(app.server).get('/api/family/children');
    expect(unauthorizedRes.status).toBe(401);

    const authorizedRes = await request(app.server)
      .get('/api/family/children')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(authorizedRes.status).toBe(200);
    expect(Array.isArray(authorizedRes.body)).toBe(true);
  });

  it('3. Creates a child profile under the parent account', async () => {
    const res = await request(app.server)
      .post('/api/family/children')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        name: 'Leo',
        age: 10,
        avatar: 'avatar_lion.png',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Leo');
    expect(res.body.role).toBe('child');
    childId = res.body.id;
  });

  it('4. Generates a 6-digit device pairing code & QR payload', async () => {
    const res = await request(app.server)
      .post(`/api/family/children/${childId}/pairing-code`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pairingCode');
    expect(res.body.pairingCode).toMatch(/^\d{6}$/);
    expect(res.body).toHaveProperty('qrPayload');
    pairingCode = res.body.pairingCode;
  });

  it('5. Pairs a device agent using the pairing code & retrieves device token', async () => {
    const res = await request(app.server)
      .post('/api/family/devices/pair')
      .send({
        pairingCode,
        deviceName: "Leo's Windows PC",
        type: 'windows',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('deviceId');
    expect(res.body).toHaveProperty('deviceToken');
    expect(res.body.deviceToken).toMatch(/^agent_/);
  });

  it('6. Rotates refresh tokens via httpOnly cookie', async () => {
    const res = await request(app.server)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
