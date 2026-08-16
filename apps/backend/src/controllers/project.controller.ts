import { FastifyRequest, FastifyReply } from 'fastify';
import { ProjectService } from '../services/project.service.js';
import { CreateProjectDTO, UpdateProjectDTO } from '@tracker/shared';

export class ProjectController {
  static async getProjects(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { includeArchived?: string };
    const includeArchived = query.includeArchived === 'true';

    try {
      const projects = await ProjectService.getProjects(user.id, includeArchived);
      return reply.send(projects);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async getProjectById(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };

    try {
      const project = await ProjectService.getProjectById(user.id, id);
      return reply.send(project);
    } catch (err: any) {
      if (err.message === 'PROJECT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async createProject(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const body = request.body as CreateProjectDTO;

    if (!body.name) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Project name is required' });
    }

    try {
      const project = await ProjectService.createProject(user.id, body);
      return reply.status(201).send(project);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async updateProject(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };
    const body = request.body as UpdateProjectDTO;

    try {
      const project = await ProjectService.updateProject(user.id, id, body);
      return reply.send(project);
    } catch (err: any) {
      if (err.message === 'PROJECT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async deleteProject(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };

    try {
      await ProjectService.deleteProject(user.id, id);
      return reply.send({ success: true, message: 'Project deleted successfully' });
    } catch (err: any) {
      if (err.message === 'PROJECT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }
}
