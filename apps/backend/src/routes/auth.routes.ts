import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Rate limited authentication endpoints (max 5 attempts per 15 minutes)
  fastify.post('/register', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, AuthController.register);
  fastify.post('/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, AuthController.login);
  fastify.post('/refresh', AuthController.refresh);
  fastify.post('/logout', AuthController.logout);
  fastify.post('/forgot-password', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, AuthController.forgotPassword);
  fastify.post('/reset-password', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, AuthController.resetPassword);
}
