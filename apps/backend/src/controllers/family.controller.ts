import { FastifyRequest, FastifyReply } from 'fastify';
import { FamilyService } from '../services/family.service.js';
import { CreateChildDTO, DevicePairDTO } from '@tracker/shared';

export class FamilyController {
  static async createChild(request: FastifyRequest, reply: FastifyReply) {
    const parentPayload = request.user as { id: string };
    try {
      const body = request.body as CreateChildDTO;
      const child = await FamilyService.createChildProfile(parentPayload.id, body);
      return reply.status(201).send(child);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async getChildren(request: FastifyRequest, reply: FastifyReply) {
    const parentPayload = request.user as { id: string };
    const children = await FamilyService.getChildrenForParent(parentPayload.id);
    return reply.send(children);
  }

  static async generatePairingCode(request: FastifyRequest, reply: FastifyReply) {
    const parentPayload = request.user as { id: string };
    const { childId } = (request.params || {}) as { childId: string };

    try {
      const pairingData = await FamilyService.generatePairingCode(parentPayload.id, childId);
      return reply.send(pairingData);
    } catch (err: any) {
      if (err.message === 'CHILD_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Child profile not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async pairDevice(request: FastifyRequest, reply: FastifyReply) {
    const { pairingCode, deviceName, type } = (request.body || {}) as DevicePairDTO;
    try {
      const deviceData = await FamilyService.pairDevice(pairingCode, deviceName, type);
      return reply.status(201).send(deviceData);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid or expired pairing code' });
    }
  }

  static async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    try {
      const { AuditService } = await import('../services/audit.service.js');
      const logs = await AuditService.getLogs(parent.id);
      return reply.send(logs);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async exportData(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const { childId } = (request.params || {}) as { childId: string };

    try {
      const { ExportService } = await import('../services/export.service.js');
      const { AuditService } = await import('../services/audit.service.js');

      await AuditService.logAccess({
        parentId: parent.id,
        childId,
        action: 'EXPORT_DATA',
        resource: `/api/family/children/${childId}/export`,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      const exportBundle = await ExportService.exportChildData(parent.id, childId);
      return reply.send(exportBundle);
    } catch (err: any) {
      if (err.message === 'CHILD_ACCESS_DENIED') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Access denied' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async hardDeleteChild(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const { childId } = (request.params || {}) as { childId: string };

    try {
      const { ExportService } = await import('../services/export.service.js');
      const { AuditService } = await import('../services/audit.service.js');

      await AuditService.logAccess({
        parentId: parent.id,
        childId,
        action: 'HARD_DELETE_CHILD',
        resource: `/api/family/children/${childId}`,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      await ExportService.hardDeleteChild(parent.id, childId);
      return reply.send({ success: true, message: 'Child profile and all associated data permanently deleted.' });
    } catch (err: any) {
      if (err.message === 'CHILD_ACCESS_DENIED') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Access denied' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }
}
