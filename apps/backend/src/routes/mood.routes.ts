import { FastifyInstance } from 'fastify';
import { MoodController } from '../controllers/mood.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function moodRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticateParent] }, MoodController.upsertMoodLog);
  fastify.get('/', { preHandler: [authenticateParent] }, MoodController.getMoodLogs);
  fastify.get('/trend', { preHandler: [authenticateParent] }, MoodController.get7DayTrend);
}
