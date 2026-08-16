import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildServer } from '../index.js';
import { prisma } from '../config/db.js';

const app = buildServer();

beforeAll(async () => {
  await app.ready();
  await prisma.user.deleteMany({
    where: { email: 'lifeos_tester@tracker.local' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: 'lifeos_tester@tracker.local' },
  });
  await app.close();
  await prisma.$disconnect();
});

describe('Phase 9: LifeOS Projects, Goals, Calendar & CSV Export Integration Tests', () => {
  let authToken: string;
  let projectId: string;
  let goalId: string;
  let milestoneId: string;

  it('1. Registers parent account for LifeOS testing', async () => {
    const res = await request(app.server)
      .post('/api/auth/register')
      .send({
        name: 'LifeOS Tester',
        email: 'lifeos_tester@tracker.local',
        password: 'Password1234!',
      });

    expect(res.status).toBe(201);
    authToken = res.body.accessToken;
  });

  describe('Projects Engine', () => {
    it('creates a project and calculates task progress percentage', async () => {
      const createRes = await request(app.server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Home Renovation',
          description: 'Living room and kitchen overhaul',
          color: '#10b981',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.name).toBe('Home Renovation');
      projectId = createRes.body.id;

      // Add two tasks to this project
      const task1 = await request(app.server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Order flooring samples',
          projectId,
          priority: 'high',
        });
      expect(task1.status).toBe(201);

      const task2 = await request(app.server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Contractor walkthrough',
          projectId,
          priority: 'medium',
        });
      expect(task2.status).toBe(201);

      // Complete task 1
      await request(app.server)
        .post(`/api/tasks/${task1.body.id}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify project progress is 50% (1 completed out of 2)
      const projectRes = await request(app.server)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(projectRes.status).toBe(200);
      expect(projectRes.body.taskCount).toBe(2);
      expect(projectRes.body.completedTaskCount).toBe(1);
      expect(projectRes.body.progressPercentage).toBe(50);
    });
  });

  describe('Goals & Milestones Engine', () => {
    it('creates a goal with milestones and calculates completion progress', async () => {
      const goalRes = await request(app.server)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Run 100km this month',
          category: 'Health',
          targetValue: 100,
          currentValue: 25,
          unit: 'km',
          deadline: '2026-08-31',
          milestones: [
            { title: 'Run first 25km' },
            { title: 'Reach 50km mark' },
          ],
        });

      expect(goalRes.status).toBe(201);
      expect(goalRes.body.title).toBe('Run 100km this month');
      expect(goalRes.body.progressPercentage).toBe(25); // 25 / 100 * 100
      expect(goalRes.body.milestones.length).toBe(2);

      goalId = goalRes.body.id;
      milestoneId = goalRes.body.milestones[0].id;

      // Toggle milestone 1 completed
      const toggleRes = await request(app.server)
        .post(`/api/goals/${goalId}/milestones/${milestoneId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.completed).toBe(true);
    });
  });

  describe('Calendar Feed & Task Merging', () => {
    it('creates calendar events and merges scheduled events with task due dates', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 3600000).toISOString();
      const endTime = new Date(now.getTime() + 7200000).toISOString();

      const eventRes = await request(app.server)
        .post('/api/calendar/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Family Dinner',
          startTime,
          endTime,
          location: 'Downtown Bistro',
          color: '#ec4899',
        });

      expect(eventRes.status).toBe(201);
      expect(eventRes.body.title).toBe('Family Dinner');

      // Query calendar feed for today
      const startRange = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endRange = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const feedRes = await request(app.server)
        .get(`/api/calendar/events?start=${startRange}&end=${endRange}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(feedRes.status).toBe(200);
      expect(Array.isArray(feedRes.body)).toBe(true);

      const titles = feedRes.body.map((item: any) => item.title);
      expect(titles).toContain('Family Dinner');
    });
  });

  describe('CSV Data Exports', () => {
    it('exports tasks to formatted CSV string with RFC 4180 headers', async () => {
      const res = await request(app.server)
        .get('/api/export/tasks/csv')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Task ID,Title,Description,Status,Priority');
      expect(res.text).toContain('Home Renovation');
    });

    it('exports habits to formatted CSV string', async () => {
      const res = await request(app.server)
        .get('/api/export/habits/csv')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Habit ID,Habit Name,Frequency,Target');
    });
  });
});
