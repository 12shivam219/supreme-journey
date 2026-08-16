import { FastifyInstance } from 'fastify';
import { ProjectController } from '../controllers/project.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function projectRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateParent] }, ProjectController.getProjects);
  fastify.get('/:id', { preHandler: [authenticateParent] }, ProjectController.getProjectById);
  fastify.post('/', { preHandler: [authenticateParent] }, ProjectController.createProject);
  fastify.put('/:id', { preHandler: [authenticateParent] }, ProjectController.updateProject);
  fastify.delete('/:id', { preHandler: [authenticateParent] }, ProjectController.deleteProject);
}
