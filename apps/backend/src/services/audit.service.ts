import { prisma } from '../config/db.js';

export class AuditService {
  /**
   * Logs parent access to sensitive resources (timelines, screenshots, export, deletion).
   */
  static async logAccess(params: {
    parentId: string;
    childId?: string;
    action: string;
    resource: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          parentId: params.parentId,
          childId: params.childId || null,
          action: params.action,
          resource: params.resource,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (err) {
      console.warn('[AuditService] Failed to record audit log:', err);
    }
  }

  /**
   * Retrieves audit logs for a parent
   */
  static async getLogs(parentId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
