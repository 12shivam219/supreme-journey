import { FastifyRequest, FastifyReply } from 'fastify';
import { JournalService } from '../services/journal.service.js';
import { UpsertJournalDTO } from '@tracker/shared';

export class JournalController {
  static async upsertEntry(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const body = request.body as UpsertJournalDTO;

    if (!body.date || body.content === undefined) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Date and content are required' });
    }

    try {
      const entry = await JournalService.upsertEntry(user.id, body);
      return reply.send(entry);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async getEntryByDate(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { date } = (request.params || {}) as { date: string };

    try {
      const entry = await JournalService.getEntryByDate(user.id, date);
      if (!entry) {
        return reply.status(404).send({ error: 'Not Found', message: 'No journal entry for this date' });
      }
      return reply.send(entry);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async searchEntries(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const query = (request.query || {}) as { q?: string; limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 50;

    try {
      const entries = await JournalService.searchEntries(user.id, query.q, limit);
      return reply.send(entries);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async deleteEntry(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { date } = (request.params || {}) as { date: string };

    try {
      await JournalService.deleteEntry(user.id, date);
      return reply.send({ success: true, message: 'Journal entry deleted' });
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }
}
