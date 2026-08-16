import { FastifyInstance } from 'fastify';
import * as Sentry from '@sentry/node';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  context?: Record<string, any>;
}

export class ApiError extends Error implements AppError {
  statusCode: number;
  code: string;
  context: Record<string, any>;

  constructor(message: string, statusCode: number = 500, code?: string, context?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.context = context || {};
  }
}

// Common error codes
export const ErrorCodes = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  CHILD_ACCESS_DENIED: 'CHILD_ACCESS_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
} as const;

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    requestId: string;
    timestamp: string;
  };
  details?: Record<string, any>;
}

export function registerErrorHandler(server: FastifyInstance) {
  // Hook: run before sending response to log all errors
  server.addHook('onError', async (request, reply, error) => {
    const isAppError = error instanceof ApiError;
    const statusCode = isAppError ? error.statusCode : 500;
    const errorCode = isAppError ? error.code : ErrorCodes.INTERNAL_ERROR;

    logger.error({
      msg: 'Request error',
      statusCode,
      errorCode,
      path: request.url,
      method: request.method,
      userId: (request.user as any)?.id,
      error: error.message,
      stack: error.stack,
      context: isAppError ? error.context : undefined,
    });

    // Send to Sentry only for unexpected errors
    if (!isAppError || statusCode >= 500) {
      Sentry.captureException(error, {
        contexts: {
          request: {
            method: request.method,
            url: request.url,
          },
          user: {
            id: (request.user as any)?.id,
          },
        },
      });
    }
  });

  // Error handler: respond with structured error
  server.setErrorHandler(async (error, request, reply) => {
    const isAppError = error instanceof ApiError;
    const statusCode = isAppError ? error.statusCode : 500;
    const errorCode = isAppError ? error.code : ErrorCodes.INTERNAL_ERROR;
    const message = isAppError ? error.message : 'An unexpected error occurred';
    const requestId = request.id || 'unknown';

    const errorResponse: ErrorResponse = {
      error: {
        code: errorCode,
        message,
        statusCode,
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    if (isAppError && error.context && Object.keys(error.context).length > 0) {
      errorResponse.details = error.context;
    }

    reply.status(statusCode).send(errorResponse);
  });
}

// Helper function to convert known error strings to ApiError
export function handleServiceError(err: any, fallbackStatusCode: number = 500): never {
  if (err instanceof ApiError) {
    throw err;
  }

  const message = err?.message || 'Unknown error occurred';

  // Map common error codes
  const errorMap: Record<string, { statusCode: number; code: string }> = {
    EMAIL_EXISTS: { statusCode: 409, code: ErrorCodes.EMAIL_EXISTS },
    INVALID_CREDENTIALS: { statusCode: 401, code: ErrorCodes.INVALID_CREDENTIALS },
    INVALID_TOKEN: { statusCode: 401, code: ErrorCodes.INVALID_TOKEN },
    TASK_NOT_FOUND: { statusCode: 404, code: ErrorCodes.RESOURCE_NOT_FOUND },
    HABIT_NOT_FOUND: { statusCode: 404, code: ErrorCodes.RESOURCE_NOT_FOUND },
    MOOD_NOT_FOUND: { statusCode: 404, code: ErrorCodes.RESOURCE_NOT_FOUND },
    JOURNAL_NOT_FOUND: { statusCode: 404, code: ErrorCodes.RESOURCE_NOT_FOUND },
    DEVICE_NOT_FOUND: { statusCode: 404, code: ErrorCodes.DEVICE_NOT_FOUND },
    ALERT_NOT_FOUND: { statusCode: 404, code: ErrorCodes.RESOURCE_NOT_FOUND },
    CHILD_ACCESS_DENIED: { statusCode: 403, code: ErrorCodes.CHILD_ACCESS_DENIED },
    INVALID_REFRESH_TOKEN: { statusCode: 401, code: ErrorCodes.INVALID_TOKEN },
  };

  const errorConfig = errorMap[message];
  if (errorConfig) {
    throw new ApiError(message, errorConfig.statusCode, errorConfig.code);
  }

  // Default to internal server error
  throw new ApiError(message, fallbackStatusCode, ErrorCodes.INTERNAL_ERROR);
}
