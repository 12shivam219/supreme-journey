import { FastifyInstance } from 'fastify';
import { HabitController } from '../controllers/habit.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function habitRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateParent] }, HabitController.getHabits);
  fastify.post('/', { preHandler: [authenticateParent] }, HabitController.createHabit);
  fastify.put('/:id', { preHandler: [authenticateParent] }, HabitController.updateHabit);
  fastify.delete('/:id', { preHandler: [authenticateParent] }, HabitController.deleteHabit);
  fastify.post('/:id/toggle', { preHandler: [authenticateParent] }, HabitController.toggleHabitLog);
  fastify.get('/heatmap', { preHandler: [authenticateParent] }, HabitController.getHeatmap);
}
