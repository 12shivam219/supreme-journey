import { FastifyRequest, FastifyReply } from 'fastify';
import { MonitoringService } from '../services/monitoring.service.js';
import { UpdateScreenTimeLimitDTO } from '@tracker/shared';

export class MonitoringController {
  static async getOverview(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const query = (request.query || {}) as { childId?: string; date?: string };

    if (!query.childId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'childId parameter is required' });
    }

    try {
      const overview = await MonitoringService.getMonitoringOverview(parent.id, query.childId, query.date);
      return reply.send(overview);
    } catch (err: any) {
      if (err.message === 'CHILD_ACCESS_DENIED') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Access to child profile denied' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async getTimeline(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const query = (request.query || {}) as { childId?: string; deviceId?: string; date?: string };

    if (!query.childId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'childId parameter is required' });
    }

    try {
      const { AuditService } = await import('../services/audit.service.js');
      await AuditService.logAccess({
        parentId: parent.id,
        childId: query.childId,
        action: 'VIEW_TIMELINE',
        resource: `/api/monitoring/timeline?date=${query.date || 'today'}`,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      const sessions = await MonitoringService.getTimelineSessions(parent.id, query.childId, query.deviceId, query.date);
      return reply.send(sessions);
    } catch (err: any) {
      if (err.message === 'CHILD_ACCESS_DENIED') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Access to child profile denied' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async getWeeklyReport(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const query = (request.query || {}) as { childId?: string; date?: string };

    if (!query.childId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'childId parameter is required' });
    }

    try {
      const report = await MonitoringService.getWeeklyReport(parent.id, query.childId, query.date);
      return reply.send(report);
    } catch (err: any) {
      if (err.message === 'CHILD_ACCESS_DENIED') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Access to child profile denied' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async getAlerts(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const query = (request.query || {}) as { childId?: string; unacknowledgedOnly?: string };
    const onlyUnack = query.unacknowledgedOnly === 'true';

    try {
      const alerts = await MonitoringService.getAlerts(parent.id, query.childId, onlyUnack);
      return reply.send(alerts);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async acknowledgeAlert(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };

    try {
      const alert = await MonitoringService.acknowledgeAlert(parent.id, id);
      return reply.send(alert);
    } catch (err: any) {
      if (err.message === 'ALERT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Alert not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async getLimits(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const { childId } = (request.params || {}) as { childId: string };

    try {
      const limits = await MonitoringService.getScreenTimeLimit(parent.id, childId);
      return reply.send(limits);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async updateLimits(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const { childId } = (request.params || {}) as { childId: string };
    const body = request.body as UpdateScreenTimeLimitDTO;

    try {
      const limits = await MonitoringService.updateScreenTimeLimit(parent.id, childId, body);
      return reply.send(limits);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async getDigestPreview(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string };
    const query = (request.query || {}) as { childId?: string; period?: 'daily' | 'weekly'; date?: string };

    if (!query.childId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'childId is required' });
    }

    try {
      await MonitoringService.verifyChildAccess(parent.id, query.childId);
      const { DigestCronService } = await import('../services/digest_cron.service.js');
      const digest = await DigestCronService.computeDigestData(query.childId, query.period || 'daily', query.date);
      return reply.send(digest);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async sendTestDigest(request: FastifyRequest, reply: FastifyReply) {
    const parent = request.user as { id: string; email?: string };
    const query = (request.query || {}) as { childId?: string };

    if (!query.childId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'childId is required' });
    }

    try {
      const child = await MonitoringService.verifyChildAccess(parent.id, query.childId);
      const { DigestCronService } = await import('../services/digest_cron.service.js');
      const { EmailService } = await import('../services/email.service.js');
      const { prisma } = await import('../config/db.js');

      const digest = await DigestCronService.computeDigestData(query.childId, 'daily');
      const html = DigestCronService.generateDigestHtml(digest);

      const parentUser = await prisma.user.findUnique({
        where: { id: parent.id },
      });

      const recipientEmail = parentUser?.email || parent.email || 'parent@tracker.local';

      try {
        await EmailService.sendEmail({
          to: recipientEmail,
          subject: `[Test] Daily Activity Digest for ${child.name}`,
          html,
        });
      } catch (mailErr: any) {
        console.warn(`[sendTestDigest] Email dispatch skipped/warned in test mode: ${mailErr.message}`);
      }

      return reply.send({ success: true, message: `Test digest generated and processed for ${recipientEmail}` });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }
}
