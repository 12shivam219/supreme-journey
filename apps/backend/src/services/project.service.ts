import { prisma } from '../config/db.js';
import { CreateProjectDTO, UpdateProjectDTO, Project } from '@tracker/shared';

export class ProjectService {
  static async createProject(userId: string, dto: CreateProjectDTO): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description || null,
        color: dto.color || '#f59e0b',
        status: 'active',
      },
    });

    return {
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status as any,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      taskCount: 0,
      completedTaskCount: 0,
      progressPercentage: 0,
    };
  }

  static async getProjects(userId: string, includeArchived = false): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { status: { not: 'archived' } }),
      },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => {
      const total = p.tasks.length;
      const completed = p.tasks.filter((t) => t.status === 'completed').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: p.id,
        userId: p.userId,
        name: p.name,
        description: p.description,
        color: p.color,
        status: p.status as any,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        taskCount: total,
        completedTaskCount: completed,
        progressPercentage: progress,
      };
    });
  }

  static async getProjectById(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        tasks: {
          orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { dueDate: 'asc' },
          ],
        },
      },
    });

    if (!project) throw new Error('PROJECT_NOT_FOUND');

    const total = project.tasks.length;
    const completed = project.tasks.filter((t) => t.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      ...project,
      taskCount: total,
      completedTaskCount: completed,
      progressPercentage: progress,
    };
  }

  static async updateProject(userId: string, projectId: string, dto: UpdateProjectDTO) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) throw new Error('PROJECT_NOT_FOUND');

    return prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  static async deleteProject(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) throw new Error('PROJECT_NOT_FOUND');

    return prisma.project.delete({
      where: { id: projectId },
    });
  }
}
