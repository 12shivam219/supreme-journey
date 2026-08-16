import { prisma } from '../config/db.js';
import { UpsertJournalDTO } from '@tracker/shared';
import { EncryptionService } from './encryption.service.js';

export class JournalService {
  private static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static async upsertEntry(userId: string, dto: UpsertJournalDTO) {
    const entryDate = this.parseDate(dto.date);
    const encryptedContent = EncryptionService.encrypt(dto.content);

    const entry = await prisma.journalEntry.upsert({
      where: {
        userId_date: {
          userId,
          date: entryDate,
        },
      },
      create: {
        userId,
        date: entryDate,
        content: encryptedContent,
      },
      update: {
        content: encryptedContent,
      },
    });

    return {
      id: entry.id,
      userId: entry.userId,
      date: this.formatDate(entry.date),
      content: EncryptionService.decrypt(entry.content),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  static async getEntryByDate(userId: string, dateStr: string) {
    const entryDate = this.parseDate(dateStr);
    const entry = await prisma.journalEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date: entryDate,
        },
      },
    });

    if (!entry) return null;

    return {
      id: entry.id,
      userId: entry.userId,
      date: this.formatDate(entry.date),
      content: EncryptionService.decrypt(entry.content),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  static async searchEntries(userId: string, query?: string, limit = 50) {
    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    const decrypted = entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      date: this.formatDate(e.date),
      content: EncryptionService.decrypt(e.content),
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));

    if (!query) return decrypted.slice(0, limit);

    return decrypted
      .filter((e) => e.content.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
  }

  static async deleteEntry(userId: string, dateStr: string) {
    const entryDate = this.parseDate(dateStr);
    return prisma.journalEntry.delete({
      where: {
        userId_date: {
          userId,
          date: entryDate,
        },
      },
    });
  }
}
