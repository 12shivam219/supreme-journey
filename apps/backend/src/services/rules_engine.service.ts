import { prisma } from '../config/db.js';
import { SocketService } from './socket.service.js';
import { IngestResponseDTO } from '@tracker/shared';

export class RulesEngineService {
  /**
   * Evaluates incoming activity telemetry against active screen time limits.
   * Dispatches alerts at 80% (approaching) and 100% (breached).
   */
  static async evaluateScreenTime(childId: string, deviceId: string, totalMinutesToday: number): Promise<IngestResponseDTO> {
    // 1. Fetch child and active rules
    const child = await prisma.user.findUnique({
      where: { id: childId },
      include: { screenTimeLimit: true },
    });

    if (!child) {
      return {
        success: true,
        limitBreached: false,
        usagePercentage: 0,
        shouldEnforce: false,
        enforcementMode: 'none',
      };
    }

    const dailyLimit = child.screenTimeLimit?.dailyMinutesLimit || 240;
    const usagePercentage = Math.round((totalMinutesToday / dailyLimit) * 100);
    const limitBreached = totalMinutesToday >= dailyLimit;
    const limitApproaching = usagePercentage >= 80 && !limitBreached;

    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    // 2. Check if 80% warning alert was already triggered today
    if (limitApproaching) {
      const existingWarning = await prisma.alert.findFirst({
        where: {
          childId,
          type: 'SCREEN_TIME_APPROACHING',
          triggeredAt: { gte: todayDate },
        },
      });

      if (!existingWarning) {
        const alert = await prisma.alert.create({
          data: {
            childId,
            type: 'SCREEN_TIME_APPROACHING',
            message: `${child.name} has used 80% (${totalMinutesToday}m / ${dailyLimit}m) of their daily screen time allowance.`,
          },
        });

        await SocketService.broadcastAlert(childId, {
          id: alert.id,
          childId: child.id,
          childName: child.name,
          type: alert.type,
          message: alert.message,
          triggeredAt: alert.triggeredAt.toISOString(),
        });
      }
    }

    // 3. Check if 100% breach alert was already triggered today
    if (limitBreached) {
      const existingBreach = await prisma.alert.findFirst({
        where: {
          childId,
          type: 'SCREEN_TIME_BREACHED',
          triggeredAt: { gte: todayDate },
        },
      });

      if (!existingBreach) {
        const alert = await prisma.alert.create({
          data: {
            childId,
            type: 'SCREEN_TIME_BREACHED',
            message: `${child.name} has reached their daily screen time limit (${dailyLimit}m). Enforcement triggered.`,
          },
        });

        await SocketService.broadcastAlert(childId, {
          id: alert.id,
          childId: child.id,
          childName: child.name,
          type: alert.type,
          message: alert.message,
          triggeredAt: alert.triggeredAt.toISOString(),
        });
      }

      return {
        success: true,
        limitBreached: true,
        usagePercentage,
        shouldEnforce: true,
        enforcementMode: 'lock',
        message: 'Daily screen time limit reached.',
      };
    }

    return {
      success: true,
      limitBreached: false,
      usagePercentage,
      shouldEnforce: false,
      enforcementMode: limitApproaching ? 'warning' : 'none',
    };
  }

  /**
   * Checks if an app is new and logs an alert if never seen before.
   */
  static async checkNewAppInstalled(childId: string, appName: string) {
    const priorSession = await prisma.appSession.findFirst({
      where: {
        device: { childId },
        appName,
      },
    });

    if (!priorSession) {
      const child = await prisma.user.findUnique({ where: { id: childId } });
      const alert = await prisma.alert.create({
        data: {
          childId,
          type: 'NEW_APP_DETECTED',
          message: `New application "${appName}" was launched on ${child?.name || 'child'}'s device.`,
        },
      });

      if (child) {
        await SocketService.broadcastAlert(childId, {
          id: alert.id,
          childId: child.id,
          childName: child.name,
          type: alert.type,
          message: alert.message,
          triggeredAt: alert.triggeredAt.toISOString(),
        });
      }
    }
  }
}
