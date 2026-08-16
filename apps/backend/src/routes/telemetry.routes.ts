import { FastifyInstance } from 'fastify';
import { TelemetryController } from '../controllers/telemetry.controller.js';
import { authenticateDeviceToken } from '../middleware/auth.js';

export async function telemetryRoutes(fastify: FastifyInstance) {
  // Device agent only telemetry ingestion routes
  fastify.post('/sessions', { preHandler: [authenticateDeviceToken] }, TelemetryController.ingestSession);
  fastify.post('/screentime', { preHandler: [authenticateDeviceToken] }, TelemetryController.ingestScreenTime);
  fastify.post('/alerts', { preHandler: [authenticateDeviceToken] }, TelemetryController.ingestAlert);
}
