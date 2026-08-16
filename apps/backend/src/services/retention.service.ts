import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../config/db.js';

export class RetentionCronService {
  private static task: ScheduledTask | null = null;

  /**
   * Initializes the daily data retention pruning job (runs at 02:00 AM daily).
   * Purges raw app_sessions older than retentionDays (default 30 days),
   * while keeping aggregated screen_time_daily intact.
   */
  static init(retentionDays = 30) {
    this.task = cron.schedule('0 2 * * *', async () => {
      console.log(`[RetentionCronService] Running data retention prune job (> ${retentionDays} days)...`);
      await this.pruneOldAppSessions(retentionDays);
    });
  }

  static stop() {
    if (this.task) {
      this.task.stop();
    }
  }

  static async pruneOldAppSessions(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - daysToKeep);

    try {
      const result = await prisma.appSession.deleteMany({
        where: {
          startTime: { lt: cutoffDate },
        },
      });

      console.log(`[RetentionCronService] Purged ${result.count} raw app sessions older than ${cutoffDate.toISOString()}`);
      return result.count;
    } catch (err) {
      console.error('[RetentionCronService] Error pruning old sessions:', err);
      return 0;
    }
  }
}
