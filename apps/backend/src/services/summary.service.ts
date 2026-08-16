import { HabitService } from './habit.service.js';
import { MoodService } from './mood.service.js';
import { TaskService } from './task.service.js';
import { DailySummaryResponse } from '@tracker/shared';

export class SummaryService {
  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static async getDailySummary(userId: string, targetDateStr?: string): Promise<DailySummaryResponse> {
    const todayFormatted = targetDateStr || this.formatDate(new Date());

    // 1. Fetch habits and completion stats
    const habits = await HabitService.getHabits(userId, false, todayFormatted);
    const completedHabits = habits.filter((h) => h.completedToday).length;
    const totalHabits = habits.length;
    const habitCompletionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    // 2. Fetch today's tasks
    const todayTasks = await TaskService.getTasks(userId, 'today', todayFormatted);
    const completedTasks = todayTasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = todayTasks.filter((t) => t.status !== 'completed').length;

    // 3. Fetch mood trend (7-day) and today's score
    const moodTrend7Days = await MoodService.get7DayMoodTrend(userId, todayFormatted);
    const todayMood = moodTrend7Days.find((m) => m.date === todayFormatted);

    return {
      date: todayFormatted,
      tasks: {
        total: todayTasks.length,
        completed: completedTasks,
        pending: pendingTasks,
        items: todayTasks,
      },
      habits: {
        total: totalHabits,
        completed: completedHabits,
        completionPercentage: habitCompletionPercentage,
        items: habits,
      },
      mood: {
        todayScore: todayMood && todayMood.moodScore > 0 ? todayMood.moodScore : null,
        todayNote: todayMood?.note || null,
        trend7Days: moodTrend7Days,
      },
    };
  }
}
