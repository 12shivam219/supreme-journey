import { FastifyRequest, FastifyReply } from 'fastify';
import { HabitService } from '../services/habit.service.js';
import { CreateHabitDTO, UpdateHabitDTO, ToggleHabitLogDTO } from '@tracker/shared';

export class HabitController {
  static async getHabits(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { archived?: string; date?: string };
    const includeArchived = query.archived === 'true';

    try {
      const habits = await HabitService.getHabits(user.id, includeArchived, query.date);
      return reply.send(habits);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async createHabit(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const body = request.body as CreateHabitDTO;

    if (!body.name) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Habit name is required' });
    }

    try {
      const habit = await HabitService.createHabit(user.id, body);
      return reply.status(201).send(habit);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async updateHabit(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };
    const body = request.body as UpdateHabitDTO;

    try {
      const habit = await HabitService.updateHabit(user.id, id, body);
      return reply.send(habit);
    } catch (err: any) {
      if (err.message === 'HABIT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Habit not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async deleteHabit(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };

    try {
      await HabitService.deleteHabit(user.id, id);
      return reply.send({ success: true, message: 'Habit deleted successfully' });
    } catch (err: any) {
      if (err.message === 'HABIT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Habit not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async toggleHabitLog(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };
    const body = request.body as ToggleHabitLogDTO;

    if (!body.date) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Date is required (YYYY-MM-DD)' });
    }

    try {
      const log = await HabitService.toggleHabitLog(user.id, id, body);
      return reply.send(log);
    } catch (err: any) {
      if (err.message === 'HABIT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Habit not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async getHeatmap(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { habitId?: string; days?: string };
    const days = query.days ? parseInt(query.days, 10) : 90;

    try {
      const heatmap = await HabitService.getHabitHeatmap(user.id, query.habitId, days);
      return reply.send(heatmap);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }
}
