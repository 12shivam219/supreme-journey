import { FastifyInstance } from 'fastify';
import { TaskController } from '../controllers/task.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function taskRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateParent] }, TaskController.getTasks);
  fastify.post('/', { preHandler: [authenticateParent] }, TaskController.createTask);
  fastify.put('/:id', { preHandler: [authenticateParent] }, TaskController.updateTask);
  fastify.post('/:id/toggle', { preHandler: [authenticateParent] }, TaskController.toggleTask);
  fastify.delete('/:id', { preHandler: [authenticateParent] }, TaskController.deleteTask);
}
