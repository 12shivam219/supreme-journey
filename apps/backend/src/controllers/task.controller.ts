import { FastifyRequest, FastifyReply } from 'fastify';
import { TaskService } from '../services/task.service.js';
import { CreateTaskDTO, UpdateTaskDTO } from '@tracker/shared';

export class TaskController {
  static async getTasks(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { filter?: 'all' | 'today' | 'overdue' | 'completed'; date?: string; projectId?: string };
    const filter = query.filter || 'all';

    try {
      const tasks = await TaskService.getTasks(user.id, filter, query.date, query.projectId);
      return reply.send(tasks);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async createTask(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const body = request.body as CreateTaskDTO;

    if (!body.title) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Task title is required' });
    }

    try {
      const task = await TaskService.createTask(user.id, body);
      return reply.status(201).send(task);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async updateTask(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };
    const body = request.body as UpdateTaskDTO;

    try {
      const task = await TaskService.updateTask(user.id, id, body);
      return reply.send(task);
    } catch (err: any) {
      if (err.message === 'TASK_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Task not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async toggleTask(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };

    try {
      const task = await TaskService.toggleTaskCompletion(user.id, id);
      return reply.send(task);
    } catch (err: any) {
      if (err.message === 'TASK_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Task not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async deleteTask(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };

    try {
      await TaskService.deleteTask(user.id, id);
      return reply.send({ success: true, message: 'Task deleted successfully' });
    } catch (err: any) {
      if (err.message === 'TASK_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Task not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }
}
