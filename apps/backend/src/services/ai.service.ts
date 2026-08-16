import { prisma } from '../config/db.js';
import { TaskService } from './task.service.js';
import { SummaryService } from './summary.service.js';
import { HabitService } from './habit.service.js';
import { AIChatRequestDTO, AIChatResponseDTO, DailyReviewSummaryDTO } from '@tracker/shared';

export class AIService {
  /**
   * Dispatches user chat prompt through controlled tools and generates context-aware responses.
   */
  static async processChat(userId: string, dto: AIChatRequestDTO): Promise<AIChatResponseDTO> {
    const prompt = dto.message.trim();
    const promptLower = prompt.toLowerCase();
    const targetDate = dto.contextDate || new Date().toISOString().split('T')[0];

    // 1. Tool Intent: Create Task
    // e.g. "Add a task to review math homework due tomorrow with high priority"
    // e.g. "Create task: Buy groceries"
    if (
      promptLower.startsWith('create task') ||
      promptLower.startsWith('add task') ||
      promptLower.startsWith('new task') ||
      promptLower.includes('add a task') ||
      promptLower.includes('remind me to')
    ) {
      let cleanTitle = prompt
        .replace(/^(create task[:\s]*|add task[:\s]*|new task[:\s]*|add a task to\s*|remind me to\s*)/i, '')
        .trim();

      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      if (promptLower.includes('urgent priority') || promptLower.includes('urgent')) priority = 'urgent';
      else if (promptLower.includes('high priority') || promptLower.includes('important')) priority = 'high';
      else if (promptLower.includes('low priority')) priority = 'low';

      // Clean priority mentions from title
      cleanTitle = cleanTitle.replace(/\b(with\s+)?(urgent|high|medium|low)\s+priority\b/gi, '').trim();

      // Check due date
      let dueDate: string | null = targetDate;
      if (promptLower.includes('tomorrow')) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        dueDate = d.toISOString().split('T')[0];
        cleanTitle = cleanTitle.replace(/\b(due\s+)?tomorrow\b/gi, '').trim();
      }

      const created = await TaskService.createTask(userId, {
        title: cleanTitle || 'New Action Item',
        dueDate,
        priority,
      });

      return {
        reply: `I've created the task "${created.title}" scheduled for ${dueDate || 'today'} with ${priority} priority.`,
        actionExecuted: {
          action: 'CREATE_TASK',
          details: created,
        },
        suggestedPrompts: [
          'Show my tasks for today',
          'What habits are pending?',
          'Generate my daily review',
        ],
      };
    }

    // 2. Tool Intent: List/Check Tasks
    if (
      promptLower.includes('my tasks') ||
      promptLower.includes('what tasks') ||
      promptLower.includes('pending tasks') ||
      promptLower.includes('show tasks') ||
      promptLower.includes('overdue')
    ) {
      const filter = promptLower.includes('overdue') ? 'overdue' : promptLower.includes('all') ? 'all' : 'today';
      const tasks = await TaskService.getTasks(userId, filter, targetDate);

      if (tasks.length === 0) {
        return {
          reply: `You have no ${filter === 'overdue' ? 'overdue' : 'pending'} tasks for today! Great job staying on top of your schedule.`,
          suggestedPrompts: ['Add task: Prepare dinner', 'Check my habit streak', 'Generate evening review'],
        };
      }

      const taskList = tasks.map((t, idx) => `${idx + 1}. [${t.status === 'completed' ? '✓' : ' '}] **${t.title}** (${t.priority} priority)`).join('\n');
      return {
        reply: `Here are your ${filter} tasks:\n\n${taskList}`,
        suggestedPrompts: ['Add a new task', 'How is my habit streak?', 'Generate my daily review'],
      };
    }

    // 3. Tool Intent: Check Habits & Streaks
    if (promptLower.includes('habit') || promptLower.includes('streak')) {
      const habits = await HabitService.getHabits(userId, false, targetDate);
      if (habits.length === 0) {
        return {
          reply: 'You currently have no active habits configured. Visit the Habits tab to establish your first routine!',
          suggestedPrompts: ['Show my tasks for today', 'Create task: Morning stretch'],
        };
      }

      const habitList = habits
        .map((h) => `- **${h.name}**: ${h.completedToday ? '✓ Completed today' : '○ Pending'} (${h.currentStreak} day streak, best: ${h.longestStreak}d)`)
        .join('\n');

      return {
        reply: `Here is your current habit status:\n\n${habitList}`,
        suggestedPrompts: ['Show my tasks for today', 'Generate daily review reflection'],
      };
    }

    // 4. Tool Intent: Daily Summary / Evening Review
    if (
      promptLower.includes('review') ||
      promptLower.includes('summary') ||
      promptLower.includes('how did i do') ||
      promptLower.includes('daily report')
    ) {
      const review = await this.generateDailyReview(userId, targetDate);
      return {
        reply: `### ${review.greeting}\n\n${review.reflectionSummary}\n\n**Key Metrics Today:**\n- Tasks: ${review.tasksCompleted} completed, ${review.tasksPending} pending\n- Habits: ${review.habitsCompleted} completed (${review.habitScorePercentage}% score)\n\n**Suggested Focus for Tomorrow:**\n${review.suggestedFocusForTomorrow.map((f) => `- ${f}`).join('\n')}`,
        actionExecuted: {
          action: 'DAILY_REVIEW_GENERATED',
          details: review,
        },
        suggestedPrompts: ['Show my tasks for today', 'What are my habits?'],
      };
    }

    // 5. Default Context-Aware Productivity Assistant Response
    const summary = await SummaryService.getDailySummary(userId, targetDate);
    return {
      reply: `I am your Tracker LifeOS Assistant. Today you have completed ${summary.tasks.completed}/${summary.tasks.total} tasks and ${summary.habits.completed}/${summary.habits.total} habits. How can I help you organize your day?`,
      suggestedPrompts: [
        'Show my tasks for today',
        'Add task: Plan weekly goals',
        'What are my habit streaks?',
        'Generate my daily review',
      ],
    };
  }

  /**
   * Generates structured daily review summary for evening reflection
   */
  static async generateDailyReview(userId: string, targetDateStr?: string): Promise<DailyReviewSummaryDTO> {
    const targetDate = targetDateStr || new Date().toISOString().split('T')[0];
    const summary = await SummaryService.getDailySummary(userId, targetDate);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userName = user?.name || 'there';

    const greeting = `Evening Reflection for ${userName}`;
    let reflectionSummary = '';

    const taskRatio = summary.tasks.total > 0 ? summary.tasks.completed / summary.tasks.total : 1;
    const habitScore = summary.habits.completionPercentage;

    if (taskRatio >= 0.8 && habitScore >= 80) {
      reflectionSummary = 'Outstanding work today! You executed on almost all your planned duties and maintained steady habit discipline.';
    } else if (taskRatio >= 0.5 || habitScore >= 50) {
      reflectionSummary = 'Solid progress made today. You knocked out essential priorities and maintained good routine momentum.';
    } else {
      reflectionSummary = 'A quiet day of steady focus. Rest well tonight and prioritize your top 3 needle-moving tasks tomorrow.';
    }

    const pendingTaskTitles = summary.tasks.items
      .filter((t) => t.status !== 'completed')
      .map((t) => `Carry over and tackle "${t.title}" first`)
      .slice(0, 2);

    const suggestedFocus = pendingTaskTitles.length > 0
      ? pendingTaskTitles
      : ['Plan top 3 high-impact priorities for tomorrow', 'Protect morning focus block with deep work'];

    return {
      date: targetDate,
      greeting,
      reflectionSummary,
      tasksCompleted: summary.tasks.completed,
      tasksPending: summary.tasks.pending,
      habitsCompleted: summary.habits.completed,
      habitScorePercentage: summary.habits.completionPercentage,
      moodScore: summary.mood.todayScore,
      screenTimeTotalMinutes: 0,
      suggestedFocusForTomorrow: suggestedFocus,
    };
  }
}
