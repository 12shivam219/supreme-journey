import { FastifyInstance } from 'fastify';
import { JournalController } from '../controllers/journal.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function journalRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticateParent] }, JournalController.upsertEntry);
  fastify.get('/date/:date', { preHandler: [authenticateParent] }, JournalController.getEntryByDate);
  fastify.get('/search', { preHandler: [authenticateParent] }, JournalController.searchEntries);
  fastify.delete('/date/:date', { preHandler: [authenticateParent] }, JournalController.deleteEntry);
}
