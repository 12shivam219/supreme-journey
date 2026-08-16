import { prisma } from '../config/db.js';

export class CsvExportService {
  private static escapeCsv(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  static async exportTasksToCsv(userId: string): Promise<string> {
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: {
        project: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Task ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Project', 'Recurrence', 'Completed At', 'Created At'];
    const rows = tasks.map((t) => [
      t.id,
      t.title,
      t.description || '',
      t.status,
      t.priority,
      t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
      t.project?.name || '',
      t.recurrenceRule || '',
      t.completedAt ? t.completedAt.toISOString() : '',
      t.createdAt.toISOString(),
    ]);

    const csvLines = [
      headers.map(this.escapeCsv).join(','),
      ...rows.map((row) => row.map(this.escapeCsv).join(',')),
    ];

    return csvLines.join('\r\n');
  }

  static async exportHabitsToCsv(userId: string): Promise<string> {
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Habit ID', 'Habit Name', 'Frequency', 'Target', 'Archived', 'Log Date', 'Completed', 'Note'];
    const rows: any[][] = [];

    for (const habit of habits) {
      if (habit.logs.length === 0) {
        rows.push([
          habit.id,
          habit.name,
          habit.frequency,
          habit.target,
          habit.archived ? 'true' : 'false',
          '',
          '',
          '',
        ]);
      } else {
        for (const log of habit.logs) {
          rows.push([
            habit.id,
            habit.name,
            habit.frequency,
            habit.target,
            habit.archived ? 'true' : 'false',
            log.date.toISOString().split('T')[0],
            log.completed ? 'true' : 'false',
            log.note || '',
          ]);
        }
      }
    }

    const csvLines = [
      headers.map(this.escapeCsv).join(','),
      ...rows.map((row) => row.map(this.escapeCsv).join(',')),
    ];

    return csvLines.join('\r\n');
  }

  static async exportScreenTimeToCsv(userId: string, childId: string): Promise<string> {
    // Verify parent has access
    const link = await prisma.familyLink.findUnique({
      where: {
        parentId_childId: {
          parentId: userId,
          childId,
        },
      },
      include: { child: true },
    });

    if (!link) throw new Error('CHILD_ACCESS_DENIED');

    const devices = await prisma.device.findMany({
      where: { childId },
    });
    const deviceIds = devices.map((d) => d.id);
    const deviceMap = new Map(devices.map((d) => [d.id, d.deviceName]));

    const screenTime = await prisma.screenTimeDaily.findMany({
      where: { deviceId: { in: deviceIds } },
      orderBy: { date: 'desc' },
    });

    const headers = ['Child Name', 'Device Name', 'Date', 'Total Minutes', 'App Breakdown'];
    const rows = screenTime.map((s) => [
      link.child.name,
      deviceMap.get(s.deviceId) || s.deviceId,
      s.date.toISOString().split('T')[0],
      s.totalMinutes,
      s.byAppBreakdownJson ? JSON.stringify(s.byAppBreakdownJson) : '',
    ]);

    const csvLines = [
      headers.map(this.escapeCsv).join(','),
      ...rows.map((row) => row.map(this.escapeCsv).join(',')),
    ];

    return csvLines.join('\r\n');
  }
}
