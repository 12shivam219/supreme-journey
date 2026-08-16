import { prisma } from '../config/db.js';
import { CreateGoalDTO, UpdateGoalDTO, CreateMilestoneDTO, Goal } from '@tracker/shared';

export class GoalService {
  private static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  static async createGoal(userId: string, dto: CreateGoalDTO): Promise<Goal> {
    const deadline = dto.deadline ? this.parseDate(dto.deadline) : null;

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description || null,
        category: dto.category || 'Personal',
        targetValue: dto.targetValue || null,
        currentValue: dto.currentValue || 0,
        unit: dto.unit || null,
        deadline,
        status: 'in_progress',
        milestones: dto.milestones && dto.milestones.length > 0
          ? {
              create: dto.milestones.map((m) => ({
                title: m.title,
                dueDate: m.dueDate ? this.parseDate(m.dueDate) : null,
              })),
            }
          : undefined,
      },
      include: {
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.formatGoalResponse(goal);
  }

  static async getGoals(userId: string, category?: string, status?: string): Promise<Goal[]> {
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => this.formatGoalResponse(g));
  }

  static async getGoalById(userId: string, goalId: string): Promise<Goal> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
      include: {
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!goal) throw new Error('GOAL_NOT_FOUND');

    return this.formatGoalResponse(goal);
  }

  static async updateGoal(userId: string, goalId: string, dto: UpdateGoalDTO): Promise<Goal> {
    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existing) throw new Error('GOAL_NOT_FOUND');

    const deadline = dto.deadline !== undefined ? (dto.deadline ? this.parseDate(dto.deadline) : null) : undefined;

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.targetValue !== undefined && { targetValue: dto.targetValue }),
        ...(dto.currentValue !== undefined && { currentValue: dto.currentValue }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(deadline !== undefined && { deadline }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.formatGoalResponse(updated);
  }

  static async deleteGoal(userId: string, goalId: string) {
    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existing) throw new Error('GOAL_NOT_FOUND');

    return prisma.goal.delete({
      where: { id: goalId },
    });
  }

  static async addMilestone(userId: string, goalId: string, dto: CreateMilestoneDTO) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) throw new Error('GOAL_NOT_FOUND');

    const dueDate = dto.dueDate ? this.parseDate(dto.dueDate) : null;

    return prisma.milestone.create({
      data: {
        goalId,
        title: dto.title,
        dueDate,
      },
    });
  }

  static async toggleMilestone(userId: string, goalId: string, milestoneId: string, completed: boolean) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) throw new Error('GOAL_NOT_FOUND');

    return prisma.milestone.update({
      where: { id: milestoneId },
      data: { completed },
    });
  }

  static async deleteMilestone(userId: string, goalId: string, milestoneId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) throw new Error('GOAL_NOT_FOUND');

    return prisma.milestone.delete({
      where: { id: milestoneId },
    });
  }

  private static formatGoalResponse(goal: any): Goal {
    let progressPercentage = 0;

    if (goal.targetValue && goal.targetValue > 0) {
      progressPercentage = Math.min(100, Math.round(((goal.currentValue || 0) / goal.targetValue) * 100));
    } else if (goal.milestones && goal.milestones.length > 0) {
      const completedCount = goal.milestones.filter((m: any) => m.completed).length;
      progressPercentage = Math.round((completedCount / goal.milestones.length) * 100);
    } else if (goal.status === 'completed') {
      progressPercentage = 100;
    }

    return {
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      category: goal.category as any,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      deadline: goal.deadline,
      status: goal.status as any,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      progressPercentage,
      milestones: goal.milestones || [],
    };
  }
}
