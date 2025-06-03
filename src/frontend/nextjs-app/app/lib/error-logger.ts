/**
 * Error logging utility for tracking adjustment-related errors
 */

export interface ErrorLog {
  timestamp: Date;
  category: 'save' | 'load' | 'update' | 'delete' | 'auth' | 'validation' | 'network' | 'database';
  action: string;
  error: string;
  details?: unknown;
  context?: {
    userId?: string;
    adjustmentId?: string | number;
    request?: unknown;
    response?: unknown;
  };
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 50;

  log(error: Omit<ErrorLog, 'timestamp'>) {
    const logEntry: ErrorLog = {
      ...error,
      timestamp: new Date()
    };

    this.logs.unshift(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${error.category}] ${error.action}:`, error.error, error.details);
    }

    // In production, you could send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry, LogRocket, etc.
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  getLogsByCategory(category: ErrorLog['category']): ErrorLog[] {
    return this.logs.filter(log => log.category === category);
  }

  clearLogs() {
    this.logs = [];
  }

  // Helper methods for common error scenarios
  logSaveError(error: unknown, context?: ErrorLog['context']) {
    this.log({
      category: 'save',
      action: 'Save adjustment failed',
      error: error instanceof Error ? error.message : String(error),
      details: error,
      context
    });
  }

  logLoadError(error: unknown, context?: ErrorLog['context']) {
    this.log({
      category: 'load',
      action: 'Load adjustments failed',
      error: error instanceof Error ? error.message : String(error),
      details: error,
      context
    });
  }

  logAuthError(error: unknown, context?: ErrorLog['context']) {
    this.log({
      category: 'auth',
      action: 'Authentication failed',
      error: error instanceof Error ? error.message : String(error),
      details: error,
      context
    });
  }

  logValidationError(field: string, value: unknown, reason: string) {
    this.log({
      category: 'validation',
      action: `Validation failed for ${field}`,
      error: reason,
      details: { field, value, reason }
    });
  }

  logNetworkError(url: string, status: number, error: unknown) {
    this.log({
      category: 'network',
      action: `Network request failed: ${url}`,
      error: `HTTP ${status}`,
      details: { url, status, error }
    });
  }

  logDatabaseError(query: string, error: unknown) {
    this.log({
      category: 'database',
      action: 'Database query failed',
      error: error instanceof Error ? error.message : String(error),
      details: { query, error }
    });
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export helper to format errors for display
export function formatErrorForUser(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('401')) {
      return 'Your session has expired. Please log in again.';
    }
    if (error.message.includes('403')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('404')) {
      return 'The requested item was not found.';
    }
    if (error.message.includes('500')) {
      return 'A server error occurred. Please try again later.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Return the original message if it's already user-friendly
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
