import { prisma } from '../config/db.js';
import { UpsertMoodDTO } from '@tracker/shared';

export class MoodService {
  private static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static async upsertMoodLog(userId: string, dto: UpsertMoodDTO) {
    if (dto.moodScore < 1 || dto.moodScore > 5) {
      throw new Error('INVALID_MOOD_SCORE');
    }

    const logDate = this.parseDate(dto.date);

    return prisma.moodLog.upsert({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
      create: {
        userId,
        date: logDate,
        moodScore: dto.moodScore,
        note: dto.note || null,
      },
      update: {
        moodScore: dto.moodScore,
        note: dto.note !== undefined ? dto.note : undefined,
      },
    });
  }

  static async getMoodLogs(userId: string, limit = 30) {
    const logs = await prisma.moodLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      date: this.formatDate(l.date),
      moodScore: l.moodScore,
      note: l.note,
      createdAt: l.createdAt,
    }));
  }

  static async get7DayMoodTrend(userId: string, targetDateStr?: string) {
    const baseDate = targetDateStr ? this.parseDate(targetDateStr) : new Date();
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() - 6);

    const logs = await prisma.moodLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: baseDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const logMap = new Map(logs.map((l) => [this.formatDate(l.date), l]));

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateKey = this.formatDate(d);
      const log = logMap.get(dateKey);

      trend.push({
        date: dateKey,
        moodScore: log ? log.moodScore : 0,
        note: log ? log.note : null,
      });
    }

    return trend;
  }
}
