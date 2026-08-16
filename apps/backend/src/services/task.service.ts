import { prisma } from '../config/db.js';
import { CreateTaskDTO, UpdateTaskDTO, TaskStatus } from '@tracker/shared';

export class TaskService {
  private static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Recurrence Engine: Evaluates recurring task template and creates an instance for the target date if matching
   */
  public static isMatchingRecurrence(rule: string, targetDate: Date, templateCreatedAt: Date): boolean {
    const targetDayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const ruleLower = rule.trim().toLowerCase();

    // 1. Daily recurrence
    if (ruleLower === 'daily' || ruleLower === 'rrule:freq=daily') {
      return true;
    }

    // 2. Weekday recurrence (Mon-Fri)
    if (ruleLower === 'weekdays' || ruleLower === 'weekday' || ruleLower === 'rrule:freq=daily;byday=mo,tu,we,th,fr') {
      return targetDayOfWeek >= 1 && targetDayOfWeek <= 5;
    }

    // 3. Weekly recurrence (matches day of week of template creation or dueDate)
    if (ruleLower === 'weekly' || ruleLower === 'rrule:freq=weekly') {
      const templateDay = templateCreatedAt.getUTCDay();
      return targetDayOfWeek === templateDay;
    }

    // 4. Custom day of week matching (e.g., 'weekly:1,3,5' or 'byday=mo,we,fr')
    if (ruleLower.includes('byday=') || ruleLower.startsWith('weekly:')) {
      const dayMap: Record<string, number> = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };
      for (const [dayCode, dayNum] of Object.entries(dayMap)) {
        if (ruleLower.includes(dayCode) && targetDayOfWeek === dayNum) {
          return true;
        }
      }
      if (ruleLower.startsWith('weekly:')) {
        const days = ruleLower.replace('weekly:', '').split(',').map(Number);
        if (days.includes(targetDayOfWeek)) return true;
      }
    }

    return false;
  }

  /**
   * Generate recurring task instances for today for a given user
   */
  static async syncRecurringTasksForDate(userId: string, targetDateStr?: string) {
    const targetDate = targetDateStr ? this.parseDate(targetDateStr) : new Date();
    const targetDateStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
    const targetDateEnd = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999));

    // Find parent recurring tasks (templates)
    const recurringTemplates = await prisma.task.findMany({
      where: {
        userId,
        recurrenceRule: { not: null },
        parentTaskId: null,
      },
    });

    for (const template of recurringTemplates) {
      if (!template.recurrenceRule) continue;

      const shouldOccurToday = this.isMatchingRecurrence(
        template.recurrenceRule,
        targetDate,
        template.createdAt
      );

      if (shouldOccurToday) {
        // Check if an instance already exists for this template on today's date
        const existingInstance = await prisma.task.findFirst({
          where: {
            userId,
            parentTaskId: template.id,
            dueDate: {
              gte: targetDateStart,
              lte: targetDateEnd,
            },
          },
        });

        if (!existingInstance) {
          await prisma.task.create({
            data: {
              userId,
              title: template.title,
              description: template.description,
              dueDate: targetDateStart,
              priority: template.priority,
              status: 'todo',
              parentTaskId: template.id,
              recurrenceRule: template.recurrenceRule,
            },
          });
        }
      }
    }
  }

  static async createTask(userId: string, dto: CreateTaskDTO) {
    const dueDate = dto.dueDate ? this.parseDate(dto.dueDate) : null;
    const startDate = dto.startDate ? this.parseDate(dto.startDate) : null;

    return prisma.task.create({
      data: {
        userId,
        projectId: dto.projectId || null,
        title: dto.title,
        description: dto.description || null,
        dueDate,
        startDate,
        estimatedMinutes: dto.estimatedMinutes || null,
        priority: dto.priority || 'medium',
        recurrenceRule: dto.recurrenceRule || null,
        status: 'todo',
      },
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  static async updateTask(userId: string, taskId: string, dto: UpdateTaskDTO) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) throw new Error('TASK_NOT_FOUND');

    const dueDate = dto.dueDate !== undefined ? (dto.dueDate ? this.parseDate(dto.dueDate) : null) : undefined;
    const startDate = dto.startDate !== undefined ? (dto.startDate ? this.parseDate(dto.startDate) : null) : undefined;
    const isCompleting = dto.status === 'completed';

    return prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dueDate !== undefined && { dueDate }),
        ...(startDate !== undefined && { startDate }),
        ...(dto.estimatedMinutes !== undefined && { estimatedMinutes: dto.estimatedMinutes }),
        ...(dto.actualMinutes !== undefined && { actualMinutes: dto.actualMinutes }),
        ...(dto.projectId !== undefined && { projectId: dto.projectId }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.status !== undefined && {
          status: dto.status,
          completedAt: isCompleting ? new Date() : dto.status ? null : undefined,
        }),
        ...(dto.recurrenceRule !== undefined && { recurrenceRule: dto.recurrenceRule }),
      },
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  static async deleteTask(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) throw new Error('TASK_NOT_FOUND');

    return prisma.task.delete({
      where: { id: taskId },
    });
  }

  static async getTasks(userId: string, filter: 'all' | 'today' | 'overdue' | 'completed' = 'all', targetDateStr?: string, projectId?: string) {
    // Ensure recurring instances are synced for today
    await this.syncRecurringTasksForDate(userId, targetDateStr);

    const now = targetDateStr ? this.parseDate(targetDateStr) : new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    let whereClause: any = {
      userId,
      ...(projectId ? { projectId } : {}),
    };

    if (filter === 'today') {
      whereClause = {
        ...whereClause,
        status: { not: 'cancelled' },
        OR: [
          {
            dueDate: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          {
            // Tasks with no due date created today
            dueDate: null,
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        ],
      };
    } else if (filter === 'overdue') {
      whereClause = {
        ...whereClause,
        status: { notIn: ['completed', 'cancelled'] },
        dueDate: {
          lt: todayStart,
        },
      };
    } else if (filter === 'completed') {
      whereClause = {
        ...whereClause,
        status: 'completed',
      };
    }

    return prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  static async toggleTaskCompletion(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) throw new Error('TASK_NOT_FOUND');

    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date() : null;

    return prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt,
      },
    });
  }
}
