import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../config/db.js';
import { EmailService } from './email.service.js';
import { ActivityDigestDTO } from '@tracker/shared';

export class DigestCronService {
  private static task: ScheduledTask | null = null;

  /**
   * Initializes the activity digest cron schedule (e.g. daily at 8:00 PM).
   */
  static init() {
    // Run daily at 20:00 (8:00 PM)
    this.task = cron.schedule('0 20 * * *', async () => {
      console.log('[DigestCronService] Running scheduled daily activity digest job...');
      await this.sendAllDailyDigests();
    });
  }

  static stop() {
    if (this.task) {
      this.task.stop();
    }
  }

  /**
   * Computes activity digest metrics for a specific child
   * @param childId - ID of the child to generate digest for
   * @param period - 'daily' or 'weekly'
   * @param targetDate - Optional date string (YYYY-MM-DD) to generate digest for. Defaults to today.
   */
  static async computeDigestData(childId: string, period: 'daily' | 'weekly' = 'daily', targetDate?: string): Promise<ActivityDigestDTO> {
    const child = await prisma.user.findUnique({
      where: { id: childId },
    });

    if (!child) throw new Error('CHILD_NOT_FOUND');

    // Parse target date or use today
    let digestDate = new Date();
    if (targetDate) {
      const [year, month, day] = targetDate.split('-').map(Number);
      digestDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      digestDate.setUTCHours(0, 0, 0, 0);
    }

    const startDate = new Date(digestDate);
    const endDate = new Date(digestDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1); // Next day at 00:00

    if (period === 'weekly') {
      startDate.setUTCDate(startDate.getUTCDate() - 6);
    }

    const devices = await prisma.device.findMany({
      where: { childId },
      select: { id: true },
    });
    const deviceIds = devices.map((d) => d.id);

    const [screenTimeRecords, alerts, completedTasks, completedHabits] = await Promise.all([
      prisma.screenTimeDaily.findMany({
        where: {
          deviceId: { in: deviceIds },
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
      prisma.alert.findMany({
        where: {
          childId,
          triggeredAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
      prisma.task.count({
        where: {
          userId: childId,
          status: 'completed',
          completedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
      prisma.habitLog.count({
        where: {
          habit: { userId: childId },
          completed: true,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
    ]);

    let totalMinutes = 0;
    const appBreakdown: Record<string, number> = {};

    for (const rec of screenTimeRecords) {
      totalMinutes += rec.totalMinutes;
      if (rec.byAppBreakdownJson && typeof rec.byAppBreakdownJson === 'object') {
        for (const [app, mins] of Object.entries(rec.byAppBreakdownJson as Record<string, number>)) {
          appBreakdown[app] = (appBreakdown[app] || 0) + (typeof mins === 'number' ? mins : 0);
        }
      }
    }

    const topApps = Object.entries(appBreakdown)
      .map(([appName, mins]) => ({
        appName,
        minutes: mins,
        percentage: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const dateStr = digestDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return {
      childId: child.id,
      childName: child.name,
      period,
      dateRange: {
        start: dateStr,
        end: period === 'daily' ? dateStr : endDateStr,
      },
      totalScreenTimeMinutes: totalMinutes,
      totalScreenTimeHours: `${hours}h ${mins}m`,
      topApps,
      alertsTriggeredCount: alerts.length,
      tasksCompletedCount: completedTasks,
      habitsCompletedCount: completedHabits,
    };
  }

  /**
   * Generates formatted HTML email for the activity digest
   */
  static generateDigestHtml(digest: ActivityDigestDTO): string {
    const appsListHtml = digest.topApps.length > 0
      ? digest.topApps.map((a) => `
        <li style="margin-bottom: 6px; color: #334155;">
          <strong>${a.appName}</strong>: ${Math.floor(a.minutes / 60)}h ${a.minutes % 60}m (${a.percentage}%)
        </li>`).join('')
      : '<li style="color: #64748B;">No recorded app usage</li>';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
        <h2 style="color: #0F172A; margin-top: 0;">Family Tracker — ${digest.period === 'daily' ? 'Daily' : 'Weekly'} Activity Digest</h2>
        <p style="color: #64748B; font-size: 14px;">Summary for <strong>${digest.childName}</strong> (${digest.dateRange.start} – ${digest.dateRange.end})</p>

        <div style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #0F172A; margin-top: 0; font-size: 16px;">Total Screen Time</h3>
          <p style="font-size: 24px; font-weight: bold; color: #D97706; margin: 4px 0;">${digest.totalScreenTimeHours}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #0F172A; font-size: 16px;">Top Applications</h3>
          <ul style="padding-left: 20px;">
            ${appsListHtml}
          </ul>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0;">
          <div style="background-color: #F8FAFC; padding: 12px; border-radius: 8px;">
            <p style="font-size: 12px; color: #64748B; margin: 0;">Tasks Completed</p>
            <p style="font-size: 18px; font-weight: bold; color: #10B981; margin: 4px 0;">${digest.tasksCompletedCount}</p>
          </div>
          <div style="background-color: #F8FAFC; padding: 12px; border-radius: 8px;">
            <p style="font-size: 12px; color: #64748B; margin: 0;">Safety Alerts</p>
            <p style="font-size: 18px; font-weight: bold; color: #EF4444; margin: 4px 0;">${digest.alertsTriggeredCount}</p>
          </div>
        </div>

        <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">This digest was generated by Tracker Family Safety.</p>
      </div>
    `;
  }

  /**
   * Dispatches digest emails to all parents
   */
  static async sendAllDailyDigests() {
    const parents = await prisma.user.findMany({
      where: { role: 'parent' },
      include: {
        parentLinks: {
          include: { child: true },
        },
      },
    });

    for (const parent of parents) {
      for (const link of parent.parentLinks) {
        try {
          const digest = await this.computeDigestData(link.childId, 'daily');
          const html = this.generateDigestHtml(digest);

          await EmailService.sendEmail({
            to: parent.email,
            subject: `Daily Activity Digest for ${link.child.name}`,
            html,
          });
        } catch (err: any) {
          console.error(`[DigestCronService] Failed sending digest to ${parent.email}:`, err.message);
        }
      }
    }
  }
}
