import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { DeviceStatusEvent, LiveAlertEvent, LiveSessionEvent } from '@tracker/shared';

export class SocketService {
  private static io: SocketIOServer | null = null;

  static init(server: HttpServer, allowedOrigins: string[] | true): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // JWT Authentication Middleware for WebSockets
    this.io.use(async (socket: Socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const secret = process.env.JWT_SECRET || 'development_jwt_secret';
        const decoded = jwt.verify(token, secret) as { id: string; role: string };

        if (decoded.role !== 'parent') {
          return next(new Error('Only parents can join live monitoring channel'));
        }

        (socket as any).userId = decoded.id;
        next();
      } catch (err: any) {
        next(new Error('Invalid or expired token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const parentId = (socket as any).userId;
      const room = `parent:${parentId}`;
      socket.join(room);
      console.log(`[SocketService] Parent joined live monitoring room: ${room}`);

      socket.on('disconnect', () => {
        console.log(`[SocketService] Parent disconnected: ${parentId}`);
      });
    });

    return this.io;
  }

  static getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Broadcast a new safety alert in real-time to the parent's active sessions
   */
  static async broadcastAlert(childId: string, alert: LiveAlertEvent) {
    if (!this.io) return;

    // Find parent of child
    const link = await prisma.familyLink.findFirst({
      where: { childId },
    });

    if (link) {
      this.io.to(`parent:${link.parentId}`).emit('alert:new', alert);
    }
  }

  /**
   * Broadcast device online/offline state changes
   */
  static async broadcastDeviceStatus(event: DeviceStatusEvent) {
    if (!this.io) return;

    const link = await prisma.familyLink.findFirst({
      where: { childId: event.childId },
    });

    if (link) {
      this.io.to(`parent:${link.parentId}`).emit('device:status', event);
    }
  }

  /**
   * Broadcast live application session transitions
   */
  static async broadcastLiveSession(event: LiveSessionEvent) {
    if (!this.io) return;

    const link = await prisma.familyLink.findFirst({
      where: { childId: event.childId },
    });

    if (link) {
      this.io.to(`parent:${link.parentId}`).emit('session:live', event);
    }
  }
}
