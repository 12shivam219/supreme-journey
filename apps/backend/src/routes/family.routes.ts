import { FastifyInstance } from 'fastify';
import { FamilyController } from '../controllers/family.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function familyRoutes(fastify: FastifyInstance) {
  // Parent-only routes
  fastify.post('/children', { preHandler: [authenticateParent] }, FamilyController.createChild);
  fastify.get('/children', { preHandler: [authenticateParent] }, FamilyController.getChildren);
  fastify.post('/children/:childId/pairing-code', { preHandler: [authenticateParent] }, FamilyController.generatePairingCode);
  fastify.get('/audit-logs', { preHandler: [authenticateParent] }, FamilyController.getAuditLogs);
  fastify.get('/children/:childId/export', { preHandler: [authenticateParent] }, FamilyController.exportData);
  fastify.delete('/children/:childId', { preHandler: [authenticateParent] }, FamilyController.hardDeleteChild);

  // Device agent pairing route (public pairing code exchange)
  fastify.post('/devices/pair', FamilyController.pairDevice);
}
