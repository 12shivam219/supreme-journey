import { FastifyInstance } from 'fastify';
import { SummaryController } from '../controllers/summary.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function summaryRoutes(fastify: FastifyInstance) {
  fastify.get('/daily', { preHandler: [authenticateParent] }, SummaryController.getDailySummary);
}
