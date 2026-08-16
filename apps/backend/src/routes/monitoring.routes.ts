import { FastifyInstance } from 'fastify';
import { MonitoringController } from '../controllers/monitoring.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function monitoringRoutes(fastify: FastifyInstance) {
  fastify.get('/overview', { preHandler: [authenticateParent] }, MonitoringController.getOverview);
  fastify.get('/timeline', { preHandler: [authenticateParent] }, MonitoringController.getTimeline);
  fastify.get('/weekly', { preHandler: [authenticateParent] }, MonitoringController.getWeeklyReport);
  fastify.get('/alerts', { preHandler: [authenticateParent] }, MonitoringController.getAlerts);
  fastify.post('/alerts/:id/ack', { preHandler: [authenticateParent] }, MonitoringController.acknowledgeAlert);
  fastify.get('/limits/:childId', { preHandler: [authenticateParent] }, MonitoringController.getLimits);
  fastify.put('/limits/:childId', { preHandler: [authenticateParent] }, MonitoringController.updateLimits);
  fastify.get('/digest/preview', { preHandler: [authenticateParent] }, MonitoringController.getDigestPreview);
  fastify.post('/digest/test-send', { preHandler: [authenticateParent] }, MonitoringController.sendTestDigest);
}
