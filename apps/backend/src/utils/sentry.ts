import * as Sentry from '@sentry/node';

export function initSentry() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn || isTest) {
    console.log('[Sentry] Disabled for test environment or missing SENTRY_DSN');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    enabled: !isDevelopment && !!sentryDsn, // Only enable in production
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    maxValueLength: 1000,
  });

  console.log(`[Sentry] Initialized for ${process.env.NODE_ENV} environment`);
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'test') return;
  Sentry.captureException(error, { contexts: { app: context } });
}

export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error') {
  if (process.env.NODE_ENV === 'test') return;
  Sentry.captureMessage(message, level);
}

export { Sentry };
