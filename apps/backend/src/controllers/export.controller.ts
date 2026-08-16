import { FastifyRequest, FastifyReply } from 'fastify';
import { CsvExportService } from '../services/csv_export.service.js';

export class ExportController {
  static async exportTasksCsv(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };

    try {
      const csvData = await CsvExportService.exportTasksToCsv(user.id);
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="tasks_export_${Date.now()}.csv"`);
      return reply.send(csvData);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async exportHabitsCsv(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };

    try {
      const csvData = await CsvExportService.exportHabitsToCsv(user.id);
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="habits_export_${Date.now()}.csv"`);
      return reply.send(csvData);
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async exportScreenTimeCsv(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const { childId } = (request.params || {}) as { childId: string };

    try {
      const csvData = await CsvExportService.exportScreenTimeToCsv(user.id, childId);
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="screentime_${childId}_${Date.now()}.csv"`);
      return reply.send(csvData);
    } catch (err: any) {
      if (err.message === 'CHILD_ACCESS_DENIED') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Access denied' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }
}
