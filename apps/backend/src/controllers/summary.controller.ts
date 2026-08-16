import { FastifyRequest, FastifyReply } from 'fastify';
import { SummaryService } from '../services/summary.service.js';

export class SummaryController {
  static async getDailySummary(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { date?: string };

    try {
      const summary = await SummaryService.getDailySummary(user.id, query.date);
      return reply.send(summary);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }
}
