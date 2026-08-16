import { FastifyInstance } from 'fastify';
import { GoalController } from '../controllers/goal.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function goalRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateParent] }, GoalController.getGoals);
  fastify.get('/:id', { preHandler: [authenticateParent] }, GoalController.getGoalById);
  fastify.post('/', { preHandler: [authenticateParent] }, GoalController.createGoal);
  fastify.put('/:id', { preHandler: [authenticateParent] }, GoalController.updateGoal);
  fastify.delete('/:id', { preHandler: [authenticateParent] }, GoalController.deleteGoal);

  // Milestones
  fastify.post('/:id/milestones', { preHandler: [authenticateParent] }, GoalController.addMilestone);
  fastify.post('/:id/milestones/:milestoneId/toggle', { preHandler: [authenticateParent] }, GoalController.toggleMilestone);
  fastify.delete('/:id/milestones/:milestoneId', { preHandler: [authenticateParent] }, GoalController.deleteMilestone);
}
