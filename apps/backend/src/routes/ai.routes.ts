import { FastifyInstance } from 'fastify';
import { AIController } from '../controllers/ai.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.post('/chat', { preHandler: [authenticateParent] }, AIController.chat);
  fastify.get('/daily-review', { preHandler: [authenticateParent] }, AIController.getDailyReview);
}
