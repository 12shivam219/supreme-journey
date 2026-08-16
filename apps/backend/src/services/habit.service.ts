import { prisma } from '../config/db.js';
import { CreateHabitDTO, UpdateHabitDTO, ToggleHabitLogDTO } from '@tracker/shared';

export class HabitService {
  /**
   * Helper to format Date to YYYY-MM-DD string or parse UTC day boundaries
   */
  private static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Calculate current streak and longest streak from habit completion logs
   */
  public static calculateStreaks(logs: { date: Date; completed: boolean }[], todayDateStr?: string): { currentStreak: number; longestStreak: number } {
    if (!logs || logs.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const completedDates = new Set(
      logs
        .filter((l) => l.completed)
        .map((l) => this.formatDate(l.date))
    );

    if (completedDates.size === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort distinct completed dates chronologically
    const sortedDates = Array.from(completedDates).sort();

    // 1. Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of sortedDates) {
      const currentDate = this.parseDate(dateStr);
      if (prevDate) {
        const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak += 1;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = currentDate;
    }

    // 2. Calculate current streak
    const now = todayDateStr ? this.parseDate(todayDateStr) : new Date();
    const todayStr = this.formatDate(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = this.formatDate(yesterday);

    let currentStreak = 0;
    // Check if habit is completed today or yesterday to continue streak
    let checkDate: Date;
    if (completedDates.has(todayStr)) {
      checkDate = this.parseDate(todayStr);
    } else if (completedDates.has(yesterdayStr)) {
      checkDate = this.parseDate(yesterdayStr);
    } else {
      return { currentStreak: 0, longestStreak };
    }

    while (completedDates.has(this.formatDate(checkDate))) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { currentStreak, longestStreak };
  }

  static async createHabit(userId: string, dto: CreateHabitDTO) {
    return prisma.habit.create({
      data: {
        userId,
        name: dto.name,
        frequency: dto.frequency || 'daily',
        target: dto.target || 1,
      },
    });
  }

  static async updateHabit(userId: string, habitId: string, dto: UpdateHabitDTO) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
    if (!habit) throw new Error('HABIT_NOT_FOUND');

    return prisma.habit.update({
      where: { id: habitId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.target !== undefined && { target: dto.target }),
        ...(dto.archived !== undefined && { archived: dto.archived }),
      },
    });
  }

  static async deleteHabit(userId: string, habitId: string) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
    if (!habit) throw new Error('HABIT_NOT_FOUND');

    return prisma.habit.delete({
      where: { id: habitId },
    });
  }

  static async getHabits(userId: string, includeArchived = false, todayStr?: string) {
    const habits = await prisma.habit.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { archived: false }),
      },
      include: {
        logs: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const todayFormatted = todayStr || this.formatDate(new Date());

    // Generate last 7 days dates array
    const last7Days: string[] = [];
    const baseDate = this.parseDate(todayFormatted);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      last7Days.push(this.formatDate(d));
    }

    return habits.map((habit) => {
      const { currentStreak, longestStreak } = this.calculateStreaks(habit.logs, todayFormatted);
      const logMap = new Map(habit.logs.map((l) => [this.formatDate(l.date), l.completed]));

      const weeklyLogs = last7Days.map((d) => ({
        date: d,
        completed: !!logMap.get(d),
      }));

      const completedToday = !!logMap.get(todayFormatted);

      return {
        id: habit.id,
        userId: habit.userId,
        name: habit.name,
        frequency: habit.frequency,
        target: habit.target,
        archived: habit.archived,
        createdAt: habit.createdAt,
        currentStreak,
        longestStreak,
        completedToday,
        weeklyLogs,
      };
    });
  }

  static async toggleHabitLog(userId: string, habitId: string, dto: ToggleHabitLogDTO) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
    if (!habit) throw new Error('HABIT_NOT_FOUND');

    const logDate = this.parseDate(dto.date);

    return prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId,
          date: logDate,
        },
      },
      create: {
        habitId,
        date: logDate,
        completed: dto.completed,
        note: dto.note || null,
      },
      update: {
        completed: dto.completed,
        note: dto.note !== undefined ? dto.note : undefined,
      },
    });
  }

  static async getHabitHeatmap(userId: string, habitId?: string, days = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const logs = await prisma.habitLog.findMany({
      where: {
        habit: {
          userId,
          ...(habitId ? { id: habitId } : {}),
        },
        date: { gte: startDate },
        completed: true,
      },
      select: {
        date: true,
        habitId: true,
      },
    });

    const dateCounts: Record<string, number> = {};
    for (const log of logs) {
      const d = this.formatDate(log.date);
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    }

    return dateCounts;
  }
}
