import type { RequestInterceptor, ResponseInterceptor } from '../client';

interface LogEntry {
  timestamp: number;
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  error?: unknown;
}

class ApiLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  log(entry: LogEntry) {
    this.logs.push(entry);

    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[API]', entry);
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

const logger = new ApiLogger();

// Map to track request start times
const requestTimings = new Map<string, number>();

export const loggingInterceptor: {
  request: RequestInterceptor;
  response: ResponseInterceptor;
} = {
  request: {
    onRequest: (config) => {
      const requestId = `${config.method || 'GET'}-${Date.now()}`;

      // Store the start time
      requestTimings.set(requestId, Date.now());

      // Add request ID to headers for tracking
      config.headers = {
        ...config.headers,
        'X-Request-ID': requestId,
      };

      logger.log({
        timestamp: Date.now(),
        method: config.method,
      });

      return config;
    },
    onRequestError: (error) => {
      logger.log({
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    },
  },
  response: {
    onResponse: (response) => {
      const requestId = response.headers.get('X-Request-ID');
      const startTime = requestId ? requestTimings.get(requestId) : null;

      if (startTime && requestId) {
        requestTimings.delete(requestId);
      }

      logger.log({
        timestamp: Date.now(),
        url: response.url,
        status: response.status,
        duration: startTime ? Date.now() - startTime : undefined,
      });

      return response;
    },
    onResponseError: (error) => {
      // Type guard for response check
      const errorWithResponse = error as { response?: Response; status?: number };
      const requestId = errorWithResponse.response?.headers?.get('X-Request-ID') || null;
      const startTime = requestId ? requestTimings.get(requestId) : null;

      if (startTime && requestId) {
        requestTimings.delete(requestId);
      }

      logger.log({
        timestamp: Date.now(),
        status: errorWithResponse.status,
        duration: startTime ? Date.now() - startTime : undefined,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    },
  },
};

// Export logger instance for external use
export { logger };

// Helper function to install logging interceptor
export function installLoggingInterceptor(apiClient: { addRequestInterceptor: (interceptor: RequestInterceptor) => void; addResponseInterceptor: (interceptor: ResponseInterceptor) => void }) {
  apiClient.addRequestInterceptor(loggingInterceptor.request);
  apiClient.addResponseInterceptor(loggingInterceptor.response);
}
