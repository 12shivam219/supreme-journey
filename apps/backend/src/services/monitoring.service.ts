import { prisma } from '../config/db.js';
import {
  MonitoringOverviewResponse,
  WeeklyReportResponse,
  TimelineSession,
  UpdateScreenTimeLimitDTO,
} from '@tracker/shared';

export class MonitoringService {
  private static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  public static categorizeApp(appName: string): string {
    const name = appName.toLowerCase();
    if (name.includes('code') || name.includes('classroom') || name.includes('word') || name.includes('excel') || name.includes('canvas') || name.includes('duolingo')) {
      return 'Education';
    }
    if (name.includes('minecraft') || name.includes('roblox') || name.includes('steam') || name.includes('epic') || name.includes('fortnite') || name.includes('game')) {
      return 'Gaming';
    }
    if (name.includes('youtube') || name.includes('netflix') || name.includes('spotify') || name.includes('twitch') || name.includes('disney')) {
      return 'Entertainment';
    }
    if (name.includes('discord') || name.includes('whatsapp') || name.includes('telegram') || name.includes('instagram') || name.includes('tiktok')) {
      return 'Social & Chat';
    }
    if (name.includes('chrome') || name.includes('edge') || name.includes('firefox') || name.includes('browser') || name.includes('safari')) {
      return 'Browsing';
    }
    return 'Utilities';
  }

  /**
   * Verify that a child belongs to the authenticated parent
   */
  static async verifyChildAccess(parentId: string, childId: string) {
    const link = await prisma.familyLink.findUnique({
      where: {
        parentId_childId: {
          parentId,
          childId,
        },
      },
      include: {
        child: true,
      },
    });

    if (!link) {
      throw new Error('CHILD_ACCESS_DENIED');
    }
    return link.child;
  }

  /**
   * 1. Dashboard Home Overview API
   */
  static async getMonitoringOverview(parentId: string, childId: string, targetDateStr?: string): Promise<MonitoringOverviewResponse> {
    const child = await this.verifyChildAccess(parentId, childId);
    const dateStr = targetDateStr || this.formatDate(new Date());
    const queryDate = this.parseDate(dateStr);

    // Fetch child's devices
    const devices = await prisma.device.findMany({
      where: { childId },
    });

    const now = new Date();
    const onlineThreshold = 5 * 60 * 1000; // 5 minutes

    // Fetch today's screen time records for these devices
    const deviceIds = devices.map((d) => d.id);
    const screenTimeRecords = await prisma.screenTimeDaily.findMany({
      where: {
        deviceId: { in: deviceIds },
        date: queryDate,
      },
    });

    const screenTimeMap = new Map(screenTimeRecords.map((r) => [r.deviceId, r]));

    // Calculate total minutes today and per device breakdown
    let totalMinutesToday = 0;
    const appBreakdownAccumulator: Record<string, number> = {};

    const deviceOverviewList = devices.map((dev) => {
      const record = screenTimeMap.get(dev.id);
      const minutes = record?.totalMinutes || 0;
      totalMinutesToday += minutes;

      // Accumulate app breakdown
      if (record?.byAppBreakdownJson && typeof record.byAppBreakdownJson === 'object') {
        const apps = record.byAppBreakdownJson as Record<string, number>;
        for (const [app, mins] of Object.entries(apps)) {
          appBreakdownAccumulator[app] = (appBreakdownAccumulator[app] || 0) + (typeof mins === 'number' ? mins : 0);
        }
      }

      const isOnline = now.getTime() - new Date(dev.lastSeen).getTime() < onlineThreshold;

      return {
        id: dev.id,
        deviceName: dev.deviceName,
        type: dev.type,
        lastSeen: dev.lastSeen,
        isOnline,
        todayMinutes: minutes,
      };
    });

    // Top 5 apps
    const topApps = Object.entries(appBreakdownAccumulator)
      .map(([appName, minutes]) => ({
        appName,
        minutes,
        percentage: totalMinutesToday > 0 ? Math.round((minutes / totalMinutesToday) * 100) : 0,
        category: this.categorizeApp(appName),
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    // Screen Time Limit
    const limitRecord = await prisma.screenTimeLimit.findUnique({
      where: { childId },
    });
    const dailyLimit = limitRecord?.dailyMinutesLimit || 240;

    // Most recent alert
    const recentAlert = await prisma.alert.findFirst({
      where: { childId },
      orderBy: { triggeredAt: 'desc' },
    });

    return {
      childId: child.id,
      childName: child.name,
      date: dateStr,
      totalScreenTimeMinutes: totalMinutesToday,
      dailyMinutesLimit: dailyLimit,
      limitBreached: totalMinutesToday > dailyLimit,
      devices: deviceOverviewList,
      topApps,
      recentAlert: recentAlert || null,
    };
  }

  /**
   * 2. Timeline View API: Chronological app sessions
   */
  static async getTimelineSessions(parentId: string, childId: string, deviceId?: string, targetDateStr?: string): Promise<TimelineSession[]> {
    await this.verifyChildAccess(parentId, childId);
    const dateStr = targetDateStr || this.formatDate(new Date());
    const dayStart = this.parseDate(dateStr);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const sessions = await prisma.appSession.findMany({
      where: {
        device: {
          childId,
          ...(deviceId ? { id: deviceId } : {}),
        },
        startTime: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      include: {
        device: true,
      },
      orderBy: { startTime: 'desc' },
    });

    return sessions.map((s) => {
      const durationSecs = s.durationSeconds || (s.endTime ? Math.max(0, Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000)) : 0);
      return {
        id: s.id,
        deviceId: s.deviceId,
        deviceName: s.device.deviceName,
        deviceType: s.device.type,
        appName: s.appName,
        windowTitle: s.windowTitle,
        startTime: s.startTime,
        endTime: s.endTime,
        durationSeconds: durationSecs,
        durationMinutes: Math.round(durationSecs / 60),
        category: this.categorizeApp(s.appName),
      };
    });
  }

  /**
   * 3. Weekly Report View API: 7-Day Bar Chart & Category Breakdown
   */
  static async getWeeklyReport(parentId: string, childId: string, targetDateStr?: string): Promise<WeeklyReportResponse> {
    await this.verifyChildAccess(parentId, childId);
    const baseDate = targetDateStr ? this.parseDate(targetDateStr) : new Date();

    // Calculate 7-day range for this week and previous week
    const thisWeekStart = new Date(baseDate);
    thisWeekStart.setUTCDate(thisWeekStart.getUTCDate() - 6);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);

    const devices = await prisma.device.findMany({
      where: { childId },
      select: { id: true },
    });
    const deviceIds = devices.map((d) => d.id);

    const [thisWeekRecords, lastWeekRecords] = await Promise.all([
      prisma.screenTimeDaily.findMany({
        where: {
          deviceId: { in: deviceIds },
          date: { gte: thisWeekStart, lte: baseDate },
        },
      }),
      prisma.screenTimeDaily.findMany({
        where: {
          deviceId: { in: deviceIds },
          date: { gte: lastWeekStart, lt: thisWeekStart },
        },
      }),
    ]);

    // Aggregate by date
    const thisWeekMap: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};
    let totalMinutesThisWeek = 0;

    for (const rec of thisWeekRecords) {
      const dStr = this.formatDate(rec.date);
      thisWeekMap[dStr] = (thisWeekMap[dStr] || 0) + rec.totalMinutes;
      totalMinutesThisWeek += rec.totalMinutes;

      if (rec.byAppBreakdownJson && typeof rec.byAppBreakdownJson === 'object') {
        for (const [app, mins] of Object.entries(rec.byAppBreakdownJson as Record<string, number>)) {
          const cat = this.categorizeApp(app);
          categoryTotals[cat] = (categoryTotals[cat] || 0) + (typeof mins === 'number' ? mins : 0);
        }
      }
    }

    const lastWeekMap: Record<string, number> = {};
    let totalMinutesLastWeek = 0;
    for (const rec of lastWeekRecords) {
      const dStr = this.formatDate(rec.date);
      lastWeekMap[dStr] = (lastWeekMap[dStr] || 0) + rec.totalMinutes;
      totalMinutesLastWeek += rec.totalMinutes;
    }

    // Build 7-day daily breakdown items
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) {
      const currentDay = new Date(baseDate);
      currentDay.setUTCDate(currentDay.getUTCDate() - i);
      const curStr = this.formatDate(currentDay);

      const pastDay = new Date(currentDay);
      pastDay.setUTCDate(pastDay.getUTCDate() - 7);
      const pastStr = this.formatDate(pastDay);

      dailyBreakdown.push({
        date: curStr,
        dayOfWeek: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
        minutesThisWeek: thisWeekMap[curStr] || 0,
        minutesLastWeek: lastWeekMap[pastStr] || 0,
      });
    }

    // Category pie colors
    const categoryColors: Record<string, string> = {
      Education: '#10B981', // Emerald
      Gaming: '#F59E0B', // Amber
      Entertainment: '#6366F1', // Indigo
      'Social & Chat': '#EC4899', // Pink
      Browsing: '#3B82F6', // Blue
      Utilities: '#64748B', // Slate
    };

    const categoryBreakdown = Object.entries(categoryTotals).map(([category, minutes]) => ({
      category,
      minutes,
      percentage: totalMinutesThisWeek > 0 ? Math.round((minutes / totalMinutesThisWeek) * 100) : 0,
      color: categoryColors[category] || '#94A3B8',
    }));

    const percentageChange = totalMinutesLastWeek > 0
      ? Math.round(((totalMinutesThisWeek - totalMinutesLastWeek) / totalMinutesLastWeek) * 100)
      : 0;

    return {
      childId,
      dateRange: { start: this.formatDate(thisWeekStart), end: this.formatDate(baseDate) },
      totalMinutesThisWeek,
      totalMinutesLastWeek,
      percentageChange,
      dailyBreakdown,
      categoryBreakdown,
    };
  }

  /**
   * 4. Alerts Center APIs
   */
  static async getAlerts(parentId: string, childId?: string, onlyUnacknowledged = false) {
    // If childId is specified, verify parent link
    if (childId) {
      await this.verifyChildAccess(parentId, childId);
    } else {
      // Find all children belonging to this parent
      const links = await prisma.familyLink.findMany({
        where: { parentId },
      });
      const childIds = links.map((l) => l.childId);
      return prisma.alert.findMany({
        where: {
          childId: { in: childIds },
          ...(onlyUnacknowledged ? { acknowledged: false } : {}),
        },
        orderBy: { triggeredAt: 'desc' },
      });
    }

    return prisma.alert.findMany({
      where: {
        childId,
        ...(onlyUnacknowledged ? { acknowledged: false } : {}),
      },
      orderBy: { triggeredAt: 'desc' },
    });
  }

  static async acknowledgeAlert(parentId: string, alertId: string) {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new Error('ALERT_NOT_FOUND');

    await this.verifyChildAccess(parentId, alert.childId);

    return prisma.alert.update({
      where: { id: alertId },
      data: { acknowledged: true },
    });
  }

  /**
   * 5. Screen Time Limits APIs
   */
  static async getScreenTimeLimit(parentId: string, childId: string) {
    await this.verifyChildAccess(parentId, childId);
    const limit = await prisma.screenTimeLimit.findUnique({
      where: { childId },
    });

    if (!limit) {
      return prisma.screenTimeLimit.create({
        data: {
          childId,
          dailyMinutesLimit: 240,
          categoryLimitsJson: {
            Gaming: 90,
            Entertainment: 60,
            'Social & Chat': 45,
          },
          dayOfWeekLimitsJson: {
            '1': 180, // Mon
            '2': 180,
            '3': 180,
            '4': 180,
            '5': 240, // Fri
            '6': 300, // Sat
            '0': 240, // Sun
          },
        },
      });
    }

    return limit;
  }

  static async updateScreenTimeLimit(parentId: string, childId: string, dto: UpdateScreenTimeLimitDTO) {
    await this.verifyChildAccess(parentId, childId);

    return prisma.screenTimeLimit.upsert({
      where: { childId },
      create: {
        childId,
        dailyMinutesLimit: dto.dailyMinutesLimit || 240,
        categoryLimitsJson: dto.categoryLimitsJson || undefined,
        dayOfWeekLimitsJson: dto.dayOfWeekLimitsJson || undefined,
      },
      update: {
        ...(dto.dailyMinutesLimit !== undefined && { dailyMinutesLimit: dto.dailyMinutesLimit }),
        ...(dto.categoryLimitsJson !== undefined && { categoryLimitsJson: dto.categoryLimitsJson }),
        ...(dto.dayOfWeekLimitsJson !== undefined && { dayOfWeekLimitsJson: dto.dayOfWeekLimitsJson }),
      },
    });
  }
}
