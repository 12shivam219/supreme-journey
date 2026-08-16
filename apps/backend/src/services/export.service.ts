import { prisma } from '../config/db.js';
import { MonitoringService } from './monitoring.service.js';
import { EncryptionService } from './encryption.service.js';

export class ExportService {
  /**
   * Generates a complete GDPR/CCPA data export bundle for a child profile.
   */
  static async exportChildData(parentId: string, childId: string) {
    const child = await MonitoringService.verifyChildAccess(parentId, childId);

    const [devices, habits, moodLogs, journalEntries, tasks, screenTime, alerts, sessions] = await Promise.all([
      prisma.device.findMany({ where: { childId } }),
      prisma.habit.findMany({ where: { userId: childId }, include: { logs: true } }),
      prisma.moodLog.findMany({ where: { userId: childId } }),
      prisma.journalEntry.findMany({ where: { userId: childId } }),
      prisma.task.findMany({ where: { userId: childId } }),
      prisma.screenTimeDaily.findMany({ where: { device: { childId } } }),
      prisma.alert.findMany({ where: { childId } }),
      prisma.appSession.findMany({ where: { device: { childId } }, take: 1000 }),
    ]);

    const decryptedJournal = journalEntries.map((j) => ({
      ...j,
      content: EncryptionService.decrypt(j.content),
    }));

    return {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        compliance: 'GDPR / COPPA / CCPA Right to Access',
        requestedByParentId: parentId,
      },
      childProfile: {
        id: child.id,
        name: child.name,
        age: child.age,
        avatar: child.avatar,
        createdAt: child.createdAt,
      },
      devices: devices.map((d) => ({
        id: d.id,
        deviceName: d.deviceName,
        type: d.type,
        lastSeen: d.lastSeen,
      })),
      habits,
      moodLogs,
      journalEntries: decryptedJournal,
      tasks,
      screenTimeDaily: screenTime,
      alerts,
      appSessions: sessions,
    };
  }

  /**
   * Permanently hard-deletes a child profile and all associated data with cascade purging.
   */
  static async hardDeleteChild(parentId: string, childId: string) {
    await MonitoringService.verifyChildAccess(parentId, childId);

    // Delete user record (Prisma cascade handles family links, devices, logs, tasks, sessions, alerts)
    return prisma.user.delete({
      where: { id: childId },
    });
  }

  /**
   * Permanently hard-deletes a parent account, their children, and all associated family data.
   */
  static async hardDeleteParentAccount(parentId: string) {
    const links = await prisma.familyLink.findMany({
      where: { parentId },
    });

    const childIds = links.map((l) => l.childId);

    // Delete all linked children
    if (childIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: childIds } },
      });
    }

    // Delete parent
    return prisma.user.delete({
      where: { id: parentId },
    });
  }
}
