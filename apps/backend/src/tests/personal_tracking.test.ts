import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildServer } from '../index.js';
import { prisma } from '../config/db.js';
import { HabitService } from '../services/habit.service.js';

const app = buildServer();

beforeAll(async () => {
  await app.ready();
  // Clean up any test users
  await prisma.user.deleteMany({
    where: { email: 'tracker_tester@tracker.local' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: 'tracker_tester@tracker.local' },
  });
  await app.close();
  await prisma.$disconnect();
});

describe('Phase 3: Personal Tracking & Todo/Task Engine Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let habitId: string;
  let taskId: string;

  const todayStr = '2026-08-15';
  const yesterdayStr = '2026-08-14';
  const twoDaysAgoStr = '2026-08-13';

  it('1. Registers parent account for personal tracking testing', async () => {
    const res = await request(app.server)
      .post('/api/auth/register')
      .send({
        name: 'Tracker Tester',
        email: 'tracker_tester@tracker.local',
        password: 'Password1234!',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    authToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  describe('Habits & Streak Engine', () => {
    it('creates a habit and toggles completions across consecutive days', async () => {
      const createRes = await request(app.server)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Morning Meditation',
          frequency: 'daily',
          target: 1,
        });

      expect(createRes.status).toBe(201);
      habitId = createRes.body.id;
      expect(createRes.body.name).toBe('Morning Meditation');

      // Log 2 days ago
      await request(app.server)
        .post(`/api/habits/${habitId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ date: twoDaysAgoStr, completed: true });

      // Log yesterday
      await request(app.server)
        .post(`/api/habits/${habitId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ date: yesterdayStr, completed: true });

      // Log today
      await request(app.server)
        .post(`/api/habits/${habitId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ date: todayStr, completed: true });

      // Fetch habits with streaks
      const getRes = await request(app.server)
        .get(`/api/habits?date=${todayStr}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(200);
      const habit = getRes.body.find((h: any) => h.id === habitId);
      expect(habit).toBeDefined();
      expect(habit.currentStreak).toBe(3);
      expect(habit.longestStreak).toBe(3);
      expect(habit.completedToday).toBe(true);
    });

    it('streak algorithm correctly handles non-consecutive days', () => {
      const logs = [
        { date: new Date('2026-08-10'), completed: true },
        { date: new Date('2026-08-11'), completed: true },
        { date: new Date('2026-08-12'), completed: true },
        // Missed Aug 13
        { date: new Date('2026-08-14'), completed: true },
        { date: new Date('2026-08-15'), completed: true },
      ];

      const { currentStreak, longestStreak } = HabitService.calculateStreaks(logs, '2026-08-15');
      expect(currentStreak).toBe(2);
      expect(longestStreak).toBe(3);
    });
  });

  describe('Mood Tracking & 7-day Trend', () => {
    it('records mood logs and returns 7-day trend', async () => {
      const moodRes = await request(app.server)
        .post('/api/mood')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: todayStr,
          moodScore: 4,
          note: 'Productive and feeling calm.',
        });

      expect(moodRes.status).toBe(200);
      expect(moodRes.body.moodScore).toBe(4);

      const trendRes = await request(app.server)
        .get(`/api/mood/trend?date=${todayStr}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(trendRes.status).toBe(200);
      expect(Array.isArray(trendRes.body)).toBe(true);
      expect(trendRes.body.length).toBe(7);
      const todayTrend = trendRes.body.find((t: any) => t.date === todayStr);
      expect(todayTrend.moodScore).toBe(4);
    });
  });

  describe('Journal System', () => {
    it('saves a daily journal entry and searches by text', async () => {
      const journalRes = await request(app.server)
        .post('/api/journal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: todayStr,
          content: 'Deep reflection on mindful family habit tracking.',
        });

      expect(journalRes.status).toBe(200);
      expect(journalRes.body.content).toContain('Deep reflection');

      const searchRes = await request(app.server)
        .get('/api/journal/search?q=mindful')
        .set('Authorization', `Bearer ${authToken}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.length).toBeGreaterThanOrEqual(1);
      expect(searchRes.body[0].content).toContain('mindful');
    });
  });

  describe('Todo & Recurrence Engine', () => {
    it('creates regular and recurring tasks and generates today occurrences', async () => {
      // 1. Regular task
      const taskRes = await request(app.server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Review family schedule',
          priority: 'high',
          dueDate: todayStr,
        });

      expect(taskRes.status).toBe(201);
      taskId = taskRes.body.id;

      // 2. Recurring daily task template
      const recurringRes = await request(app.server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Evening wind-down routine',
          priority: 'medium',
          recurrenceRule: 'daily',
        });

      expect(recurringRes.status).toBe(201);

      // 3. Query tasks for today
      const todayTasksRes = await request(app.server)
        .get(`/api/tasks?filter=today&date=${todayStr}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(todayTasksRes.status).toBe(200);
      // Both regular task and auto-instantiated recurring task should appear
      const titles = todayTasksRes.body.map((t: any) => t.title);
      expect(titles).toContain('Review family schedule');
      expect(titles).toContain('Evening wind-down routine');

      // 4. Toggle completion
      const toggleRes = await request(app.server)
        .post(`/api/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.status).toBe('completed');
    });
  });

  describe('Daily Summary Aggregation Endpoint', () => {
    it('returns combined daily summary statistics for dashboard', async () => {
      const summaryRes = await request(app.server)
        .get(`/api/summary/daily?date=${todayStr}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.date).toBe(todayStr);
      expect(summaryRes.body.tasks.total).toBeGreaterThanOrEqual(1);
      expect(summaryRes.body.habits.total).toBeGreaterThanOrEqual(1);
      expect(summaryRes.body.mood.todayScore).toBe(4);
      expect(summaryRes.body.mood.trend7Days.length).toBe(7);
    });
  });
});
