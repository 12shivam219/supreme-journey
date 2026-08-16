import { FastifyRequest, FastifyReply } from 'fastify';
import { AIService } from '../services/ai.service.js';
import { AIChatRequestDTO } from '@tracker/shared';

export class AIController {
  static async chat(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const body = request.body as AIChatRequestDTO;

    if (!body || !body.message) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Message prompt is required' });
    }

    try {
      const response = await AIService.processChat(user.id, body);
      return reply.send(response);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async getDailyReview(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { date?: string };

    try {
      const review = await AIService.generateDailyReview(user.id, query.date);
      return reply.send(review);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }
}
