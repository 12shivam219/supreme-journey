import pino from 'pino';
import fs from 'fs';
import path from 'path';
// Keep logs relative to the process working directory so this works in both
// CommonJS builds and the production container.
const logsDir = path.resolve(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create rotating file transport for production
const createFileTransport = () => {
  if (isTest) return undefined;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const logFile = path.join(logsDir, `app-${dateStr}.log`);

  return {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    target: 'pino/file',
    options: {
      destination: logFile,
      mkdir: true,
    },
  };
};

// Transport configuration
const transports: any[] = [];

if (isDevelopment && !isTest) {
  // Pretty-print for development
  transports.push({
    level: process.env.LOG_LEVEL || 'debug',
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  });
} else if (!isTest) {
  // JSON format for production and file logging
  const fileTransport = createFileTransport();
  if (fileTransport) transports.push(fileTransport);
}

// Fallback to console for test environment
if (isTest) {
  transports.push({
    level: 'error',
    target: 'pino/file',
    options: { destination: 1 }, // stdout
  });
}

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    timestamp: !isDevelopment, // Don't duplicate timestamp in dev (pretty-printer adds it)
  },
  transports.length > 0
    ? pino.transport({
        targets: transports,
      })
    : undefined
);

// Export logger for different use cases
export const createLogger = (name: string) => {
  return logger.child({ component: name });
};

export default logger;
