import { FastifyInstance } from 'fastify';
import { ExportController } from '../controllers/export.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function exportRoutes(fastify: FastifyInstance) {
  fastify.get('/tasks/csv', { preHandler: [authenticateParent] }, ExportController.exportTasksCsv);
  fastify.get('/habits/csv', { preHandler: [authenticateParent] }, ExportController.exportHabitsCsv);
  fastify.get('/screentime/:childId/csv', { preHandler: [authenticateParent] }, ExportController.exportScreenTimeCsv);
}
