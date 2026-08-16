import { useState, useCallback } from 'react';

export interface ApiError {
  error: {
    code: string;
    message: string;
    statusCode: number;
    requestId: string;
    timestamp: string;
  };
  details?: Record<string, any>;
}

export function useApiError() {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any) => {
    let message = 'An error occurred';

    if (err instanceof Response) {
      // Response object
      message = `Error ${err.status}: ${err.statusText}`;
    } else if (err?.error?.message) {
      // Structured API error
      message = err.error.message;
    } else if (err?.message) {
      // Error object
      message = err.message;
    } else if (typeof err === 'string') {
      // String error
      message = err;
    }

    setError(message);

    // Log to Sentry if available
    if (window.__sentry__) {
      window.__sentry__.captureException(err);
    }

    return message;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, setError, handleError, clearError };
}

export interface FetchOptions extends RequestInit {
  errorMessage?: string;
}

export async function fetchWithErrorHandling(
  url: string,
  options: FetchOptions = {},
  onError?: (error: string) => void
) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error: ApiError = data;
      const message = error?.error?.message || `Request failed with status ${response.status}`;
      
      if (onError) {
        onError(message);
      }

      throw new Error(message);
    }

    return response.json();
  } catch (err) {
    const message = options.errorMessage || (err instanceof Error ? err.message : 'Unknown error');
    
    if (onError) {
      onError(message);
    }

    throw err;
  }
}

export const getUserFriendlyError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid email or password': 'The email or password you entered is incorrect. Please try again.',
    'Email is already registered': 'This email is already registered. Please use a different email or try logging in.',
    'Missing refresh token cookie': 'Your session has expired. Please log in again.',
    'Invalid or expired refresh token': 'Your session has expired. Please log in again.',
    'Access to child profile denied': 'You do not have access to this child profile.',
    'Task not found': 'This task no longer exists.',
    'Habit not found': 'This habit no longer exists.',
    'Invalid device token': 'Device authentication failed. Please re-pair your device.',
    'Too many requests': 'You are making too many requests. Please wait a moment and try again.',
  };

  return errorMap[error] || error || 'An unexpected error occurred. Please try again.';
};
