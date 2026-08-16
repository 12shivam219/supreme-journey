import * as Sentry from '@sentry/react';

export function initSentry() {
  const isDevelopment = import.meta.env.DEV;
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.log('[Sentry] Disabled - missing VITE_SENTRY_DSN');
    return;
  }

  if (isDevelopment) {
    console.log('[Sentry] Running in development mode');
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE || 'development',
    enabled: !!sentryDsn && !isDevelopment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    replaysSessionSampleRate: isDevelopment ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
  });

  // Expose Sentry to window for ErrorBoundary
  (window as any).__sentry__ = Sentry;
}

export { Sentry };
