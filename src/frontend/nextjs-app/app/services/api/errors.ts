import type { JSONValue } from '../../types/common';

export class ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: JSONValue;
  retryAfter?: number;

  constructor(message: string, status?: number, statusText?: string, data?: JSONValue) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;

    // Handle specific error cases
    if (status === 429 && typeof data === 'object' && data && 'retryAfter' in data) {
      this.retryAfter = Number(data.retryAfter);
    }
  }

  isNetworkError(): boolean {
    return !this.status || this.status === 0;
  }

  isServerError(): boolean {
    return this.status !== undefined && this.status >= 500;
  }

  isClientError(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isValidationError(): boolean {
    return this.status === 422 || this.status === 400;
  }

  getValidationErrors(): Record<string, string[]> | null {
    if (this.isValidationError() &&
        typeof this.data === 'object' &&
        this.data &&
        'errors' in this.data) {
      return this.data.errors as Record<string, string[]>;
    }
    return null;
  }
}

// Error helpers
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function createApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('An unknown error occurred');
}

// Error handler for UI components
export interface ErrorHandlerOptions {
  showNotification?: boolean;
  redirectToLogin?: boolean;
  fallbackMessage?: string;
}

export async function handleApiError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): Promise<void> {
  const {
    showNotification = true,
    redirectToLogin = true,
    fallbackMessage = 'An error occurred. Please try again.',
  } = options;

  const apiError = createApiError(error);

  // Log error for debugging
  console.error('API Error:', apiError);

  // Handle auth errors
  if (apiError.isAuthError() && redirectToLogin) {
    // Redirect to login on auth errors
    window.location.href = '/login';
    return;
  }

  // Show notification for other errors
  if (showNotification) {
    const message = apiError.isValidationError()
      ? 'Please check your input and try again.'
      : apiError.isServerError()
      ? 'Server error. Please try again later.'
      : apiError.isNetworkError()
      ? 'Network error. Please check your connection.'
      : apiError.message || fallbackMessage;

    // TODO: Integrate with notification system
    console.error(message);
  }

  throw apiError;
}
