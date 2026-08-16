import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { initSentry } from './utils/sentry.js';
import { registerErrorHandler } from './middleware/error-handler.js';
import { logger } from './utils/logger.js';
import { userRoutes } from './routes/user.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { familyRoutes } from './routes/family.routes.js';
import { habitRoutes } from './routes/habit.routes.js';
import { moodRoutes } from './routes/mood.routes.js';
import { journalRoutes } from './routes/journal.routes.js';
import { taskRoutes } from './routes/task.routes.js';
import { summaryRoutes } from './routes/summary.routes.js';
import { monitoringRoutes } from './routes/monitoring.routes.js';
import { telemetryRoutes } from './routes/telemetry.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { goalRoutes } from './routes/goal.routes.js';
import { calendarRoutes } from './routes/calendar.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { exportRoutes } from './routes/export.routes.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];

if (isProduction) {
  for (const name of ['JWT_SECRET', 'COOKIE_SECRET', 'CORS_ORIGIN']) {
    if (!process.env[name]) {
      throw new Error(`${name} must be configured in production`);
    }
  }
}

// Initialize Sentry early for error tracking
initSentry();

export function buildServer() {
  const server = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  // Register error handler before all other middleware
  registerErrorHandler(server);

  server.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  });

  server.register(cors, {
    origin: isProduction ? corsOrigins : true,
    credentials: true,
  });

  server.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'development_cookie_secret',
  });

  server.register(jwt, {
    secret: process.env.JWT_SECRET || 'development_jwt_secret',
  });

  server.register(rateLimit, {
    global: false, // Rate limit selectively per endpoint
  });

  server.get('/health', async (request, reply) => {
    logger.info({ msg: 'Health check' });
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(userRoutes, { prefix: '/api/users' });
  server.register(familyRoutes, { prefix: '/api/family' });
  server.register(habitRoutes, { prefix: '/api/habits' });
  server.register(moodRoutes, { prefix: '/api/mood' });
  server.register(journalRoutes, { prefix: '/api/journal' });
  server.register(taskRoutes, { prefix: '/api/tasks' });
  server.register(summaryRoutes, { prefix: '/api/summary' });
  server.register(monitoringRoutes, { prefix: '/api/monitoring' });
  server.register(telemetryRoutes, { prefix: '/api/telemetry' });
  server.register(projectRoutes, { prefix: '/api/projects' });
  server.register(goalRoutes, { prefix: '/api/goals' });
  server.register(calendarRoutes, { prefix: '/api/calendar' });
  server.register(aiRoutes, { prefix: '/api/ai' });
  server.register(exportRoutes, { prefix: '/api/export' });

  // Hook to attach Socket.IO server and retention cron once Fastify is ready
  server.addHook('onReady', async () => {
    const { SocketService } = await import('./services/socket.service.js');
    const { DigestCronService } = await import('./services/digest_cron.service.js');
    const { RetentionCronService } = await import('./services/retention.service.js');

    SocketService.init(server.server, isProduction ? corsOrigins : true);
    if (process.env.NODE_ENV !== 'test') {
      DigestCronService.init();
      RetentionCronService.init(30);
    }
  });

  return server;
}

async function start() {
  const server = buildServer();
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await server.listen({ port, host });
    logger.info({ msg: `[Backend API] Running on http://${host}:${port}` });
  } catch (err) {
    logger.error({ msg: 'Failed to start server', error: err });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { logger };
