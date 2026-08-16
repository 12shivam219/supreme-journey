import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildServer } from '../index.js';
import { prisma } from '../config/db.js';

const app = buildServer();

beforeAll(async () => {
  await app.ready();
  await prisma.user.deleteMany({
    where: { email: 'ai_tester@tracker.local' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: 'ai_tester@tracker.local' },
  });
  await app.close();
  await prisma.$disconnect();
});

describe('Phase 10: AI Assistant & Controlled Tool Calling Integration Tests', () => {
  let authToken: string;
  let userId: string;

  it('1. Registers parent account for AI assistant testing', async () => {
    const res = await request(app.server)
      .post('/api/auth/register')
      .send({
        name: 'AI Tester',
        email: 'ai_tester@tracker.local',
        password: 'Password1234!',
      });

    expect(res.status).toBe(201);
    authToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  it('2. Dispatches task creation via natural language prompt', async () => {
    const res = await request(app.server)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'Add a task to schedule doctor appointment with high priority',
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('doctor appointment');
    expect(res.body.actionExecuted).not.toBeNull();
    expect(res.body.actionExecuted.action).toBe('CREATE_TASK');
    expect(res.body.actionExecuted.details.priority).toBe('high');

    // Verify task exists in DB
    const dbTask = await prisma.task.findFirst({
      where: { userId, title: { contains: 'doctor appointment' } },
    });
    expect(dbTask).not.toBeNull();
  });

  it('3. Answers questions about user daily summary and pending tasks', async () => {
    const res = await request(app.server)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'Show my tasks for today',
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('doctor appointment');
  });

  it('4. Generates mindful structured Daily Review for evening reflection', async () => {
    const res = await request(app.server)
      .get('/api/ai/daily-review')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.greeting).toContain('Evening Reflection');
    expect(res.body.reflectionSummary).toBeDefined();
    expect(Array.isArray(res.body.suggestedFocusForTomorrow)).toBe(true);
  });
});
