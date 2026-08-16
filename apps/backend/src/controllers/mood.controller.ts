import { FastifyRequest, FastifyReply } from 'fastify';
import { MoodService } from '../services/mood.service.js';
import { UpsertMoodDTO } from '@tracker/shared';

export class MoodController {
  static async upsertMoodLog(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const body = request.body as UpsertMoodDTO;

    if (!body.date || !body.moodScore) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Date and mood score are required' });
    }

    try {
      const log = await MoodService.upsertMoodLog(user.id, body);
      return reply.send(log);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async getMoodLogs(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 30;

    try {
      const logs = await MoodService.getMoodLogs(user.id, limit);
      return reply.send(logs);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async get7DayTrend(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { date?: string };

    try {
      const trend = await MoodService.get7DayMoodTrend(user.id, query.date);
      return reply.send(trend);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }
}
