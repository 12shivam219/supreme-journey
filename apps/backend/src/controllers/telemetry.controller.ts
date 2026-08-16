import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/db.js';
import { IngestSessionDTO, IngestScreenTimeDTO, IngestAlertDTO } from '@tracker/shared';
import { RulesEngineService } from '../services/rules_engine.service.js';
import { SocketService } from '../services/socket.service.js';

export class TelemetryController {
  private static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  static async ingestSession(request: FastifyRequest, reply: FastifyReply) {
    const device = (request as any).device as { id: string; childId: string; deviceName: string; type: any };
    const body = request.body as IngestSessionDTO;

    const startTime = new Date(body.startTime);
    // Older agents may report an app launch before a completed session. Keep
    // that compatible while storing a minimal, explicitly bounded event.
    const endTime = body.endTime ? new Date(body.endTime) : startTime;
    const durationSeconds = body.durationSeconds ?? 1;
    if (
      typeof body.appName !== 'string' || !body.appName.trim() || body.appName.length > 160 ||
      Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) ||
      !Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 86_400 ||
      endTime < startTime ||
      (body.clientSessionId !== undefined && (!/^[A-Za-z0-9:_-]{1,160}$/.test(body.clientSessionId)))
    ) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid activity session payload' });
    }

    try {
      // 1. Update device last seen & broadcast status
      await prisma.device.update({
        where: { id: device.id },
        data: { lastSeen: new Date() },
      });

      SocketService.broadcastDeviceStatus({
        deviceId: device.id,
        childId: device.childId,
        deviceName: device.deviceName,
        type: device.type,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      });

      // 2. Check if new application was launched
      await RulesEngineService.checkNewAppInstalled(device.childId, body.appName);

      // 3. Store session
      // Do not persist raw window titles. They often contain private message,
      // document, account, and URL information and are not needed for usage totals.
      const session = body.clientSessionId
        ? await prisma.appSession.upsert({
          where: { clientSessionId: body.clientSessionId },
          create: {
            deviceId: device.id,
            clientSessionId: body.clientSessionId,
            appName: body.appName.trim(),
            windowTitle: null,
            startTime,
            endTime,
            durationSeconds,
          },
          update: {},
        })
        : await prisma.appSession.create({
        data: {
          deviceId: device.id,
          appName: body.appName.trim(),
          windowTitle: null,
          startTime,
          endTime,
          durationSeconds,
        },
      });

      // 4. Broadcast live session
      SocketService.broadcastLiveSession({
        deviceId: device.id,
        childId: device.childId,
        appName: body.appName,
        startTime: session.startTime.toISOString(),
      });

      return reply.status(201).send(session);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async ingestScreenTime(request: FastifyRequest, reply: FastifyReply) {
    const device = (request as any).device as { id: string; childId: string };
    const body = request.body as IngestScreenTimeDTO;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || '') || !Number.isInteger(body.totalMinutes) || body.totalMinutes < 0 || body.totalMinutes > 1_440) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid screen time payload' });
    }

    try {
      const targetDate = TelemetryController.parseDate(body.date);
      await prisma.screenTimeDaily.upsert({
        where: { deviceId_date: { deviceId: device.id, date: targetDate } },
        create: { deviceId: device.id, date: targetDate, totalMinutes: body.totalMinutes, byAppBreakdownJson: body.byAppBreakdownJson || undefined },
        update: { totalMinutes: body.totalMinutes, byAppBreakdownJson: body.byAppBreakdownJson || undefined },
      });

      // 2. Evaluate screen time rules and return enforcement directive
      const evaluation = await RulesEngineService.evaluateScreenTime(
        device.childId,
        device.id,
        body.totalMinutes
      );

      return reply.status(201).send({
        ...evaluation,
        totalMinutes: body.totalMinutes,
      });
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async ingestAlert(request: FastifyRequest, reply: FastifyReply) {
    const device = (request as any).device as { id: string; childId: string };
    const body = request.body as IngestAlertDTO;

    if (!body.type || !body.message) {
      return reply.status(400).send({ error: 'Bad Request', message: 'type and message are required' });
    }

    try {
      const alert = await prisma.alert.create({
        data: {
          childId: device.childId,
          type: body.type,
          message: body.message,
        },
        include: {
          child: true,
        },
      });

      // Broadcast alert over WebSocket
      SocketService.broadcastAlert(device.childId, {
        id: alert.id,
        childId: alert.childId,
        childName: alert.child.name,
        type: alert.type,
        message: alert.message,
        triggeredAt: alert.triggeredAt.toISOString(),
      });

      return reply.status(201).send(alert);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }
}
