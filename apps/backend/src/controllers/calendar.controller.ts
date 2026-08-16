import { FastifyRequest, FastifyReply } from 'fastify';
import { CalendarService } from '../services/calendar.service.js';
import { CreateCalendarEventDTO, UpdateCalendarEventDTO } from '@tracker/shared';

export class CalendarController {
  static async getFeed(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { start?: string; end?: string };

    const now = new Date();
    const start = query.start || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = query.end || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    try {
      const feed = await CalendarService.getCalendarFeed(user.id, start, end);
      return reply.send(feed);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async createEvent(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const body = request.body as CreateCalendarEventDTO;

    if (!body.title || !body.startTime || !body.endTime) {
      return reply.status(400).send({ error: 'Bad Request', message: 'title, startTime, and endTime are required' });
    }

    try {
      const event = await CalendarService.createEvent(user.id, body);
      return reply.status(201).send(event);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async updateEvent(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };
    const body = request.body as UpdateCalendarEventDTO;

    try {
      const event = await CalendarService.updateEvent(user.id, id, body);
      return reply.send(event);
    } catch (err: any) {
      if (err.message === 'EVENT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Event not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async deleteEvent(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { id } = (request.params || {}) as { id: string };

    try {
      await CalendarService.deleteEvent(user.id, id);
      return reply.send({ success: true, message: 'Event deleted successfully' });
    } catch (err: any) {
      if (err.message === 'EVENT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Event not found' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }
}
