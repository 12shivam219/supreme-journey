import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/profile', { preHandler: [authenticateParent] }, UserController.getProfile);
}
