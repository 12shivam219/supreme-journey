import { FastifyInstance } from 'fastify';
import { CalendarController } from '../controllers/calendar.controller.js';
import { authenticateParent } from '../middleware/auth.js';

export async function calendarRoutes(fastify: FastifyInstance) {
  fastify.get('/events', { preHandler: [authenticateParent] }, CalendarController.getFeed);
  fastify.post('/events', { preHandler: [authenticateParent] }, CalendarController.createEvent);
  fastify.put('/events/:id', { preHandler: [authenticateParent] }, CalendarController.updateEvent);
  fastify.delete('/events/:id', { preHandler: [authenticateParent] }, CalendarController.deleteEvent);
}
