import { FastifyRequest, FastifyReply } from 'fastify';
import { GoalService } from '../services/goal.service.js';
import { CreateGoalDTO, UpdateGoalDTO, CreateMilestoneDTO, ToggleMilestoneDTO } from '@tracker/shared';

export class GoalController {
  static async getGoals(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { category?: string; status?: string };

    try {
      const goals = await GoalService.getGoals(user.id, query.category, query.status);
      return reply.send(goals);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async getGoalById(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };

    try {
      const goal = await GoalService.getGoalById(user.id, id);
      return reply.send(goal);
    } catch (err: any) {
      if (err.message === 'GOAL_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Goal not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async createGoal(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const body = request.body as CreateGoalDTO;

    if (!body.title) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Goal title is required' });
    }

    try {
      const goal = await GoalService.createGoal(user.id, body);
      return reply.status(201).send(goal);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async updateGoal(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };
    const body = request.body as UpdateGoalDTO;

    try {
      const goal = await GoalService.updateGoal(user.id, id, body);
      return reply.send(goal);
    } catch (err: any) {
      if (err.message === 'GOAL_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Goal not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async deleteGoal(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };

    try {
      await GoalService.deleteGoal(user.id, id);
      return reply.send({ success: true, message: 'Goal deleted successfully' });
    } catch (err: any) {
      if (err.message === 'GOAL_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Goal not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async addMilestone(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };
    const body = request.body as CreateMilestoneDTO;

    if (!body.title) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Milestone title is required' });
    }

    try {
      const milestone = await GoalService.addMilestone(user.id, id, body);
      return reply.status(201).send(milestone);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async toggleMilestone(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id, milestoneId } = (request.params || {}) as { id: string; milestoneId: string };
    const body = request.body as ToggleMilestoneDTO;

    try {
      const milestone = await GoalService.toggleMilestone(user.id, id, milestoneId, body.completed);
      return reply.send(milestone);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async deleteMilestone(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id, milestoneId } = (request.params || {}) as { id: string; milestoneId: string };

    try {
      await GoalService.deleteMilestone(user.id, id, milestoneId);
      return reply.send({ success: true, message: 'Milestone deleted successfully' });
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }
}
