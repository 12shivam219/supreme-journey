import { prisma } from '../config/db.js';
import { CreateCalendarEventDTO, UpdateCalendarEventDTO, CalendarEvent } from '@tracker/shared';

export class CalendarService {
  private static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  static async getCalendarFeed(userId: string, startDateStr: string, endDateStr: string): Promise<CalendarEvent[]> {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const [events, tasks] = await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          userId,
          startTime: { lte: end },
          endTime: { gte: start },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.task.findMany({
        where: {
          userId,
          dueDate: {
            gte: start,
            lte: end,
          },
          status: { not: 'cancelled' },
        },
        include: {
          project: {
            select: { name: true, color: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const formattedEvents: CalendarEvent[] = events.map((e) => ({
      id: e.id,
      userId: e.userId,
      title: e.title,
      description: e.description,
      startTime: e.startTime,
      endTime: e.endTime,
      isAllDay: e.isAllDay,
      location: e.location,
      recurrenceRule: e.recurrenceRule,
      color: e.color || '#3b82f6',
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      isTaskDeadline: false,
    }));

    const taskEvents: CalendarEvent[] = tasks.map((t) => {
      const taskDue = new Date(t.dueDate!);
      const taskEnd = new Date(taskDue);
      taskEnd.setHours(taskEnd.getHours() + 1);

      return {
        id: `task_${t.id}`,
        userId: t.userId,
        title: `[Task] ${t.title}${t.project ? ` (${t.project.name})` : ''}`,
        description: t.description || undefined,
        startTime: taskDue,
        endTime: taskEnd,
        isAllDay: false,
        color: t.status === 'completed' ? '#10b981' : t.project?.color || '#f59e0b',
        createdAt: t.createdAt,
        isTaskDeadline: true,
      };
    });

    return [...formattedEvents, ...taskEvents].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  static async createEvent(userId: string, dto: CreateCalendarEventDTO): Promise<CalendarEvent> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime < startTime) {
      throw new Error('END_TIME_BEFORE_START_TIME');
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description || null,
        startTime,
        endTime,
        isAllDay: dto.isAllDay || false,
        location: dto.location || null,
        recurrenceRule: dto.recurrenceRule || null,
        color: dto.color || '#3b82f6',
      },
    });

    return {
      id: event.id,
      userId: event.userId,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay,
      location: event.location,
      recurrenceRule: event.recurrenceRule,
      color: event.color,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      isTaskDeadline: false,
    };
  }

  static async updateEvent(userId: string, eventId: string, dto: UpdateCalendarEventDTO): Promise<CalendarEvent> {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!existing) throw new Error('EVENT_NOT_FOUND');

    const startTime = dto.startTime ? new Date(dto.startTime) : undefined;
    const endTime = dto.endTime ? new Date(dto.endTime) : undefined;

    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(dto.isAllDay !== undefined && { isAllDay: dto.isAllDay }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.recurrenceRule !== undefined && { recurrenceRule: dto.recurrenceRule }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });

    return {
      id: event.id,
      userId: event.userId,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay,
      location: event.location,
      recurrenceRule: event.recurrenceRule,
      color: event.color,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      isTaskDeadline: false,
    };
  }

  static async deleteEvent(userId: string, eventId: string) {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!existing) throw new Error('EVENT_NOT_FOUND');

    return prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  }
}
