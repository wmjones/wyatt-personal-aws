import { config } from '../../lib/config';
import { authService } from '../auth';
import type { JSONValue } from '../../types/common';

// Types
export interface RequestOptions extends RequestInit {
  authenticated?: boolean;
  retries?: number;
  timeout?: number;
  cancelToken?: AbortController;
}

export class ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: JSONValue;

  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestInterceptor {
  onRequest?: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>;
  onRequestError?: (error: unknown) => unknown;
}

export interface ResponseInterceptor {
  onResponse?: (response: Response) => Response | Promise<Response>;
  onResponseError?: (error: unknown) => unknown;
}

// Default configuration
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const RETRY_DELAY = 1000; // 1 second base delay for exponential backoff

export class ApiClient {
  private baseUrl: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.setupDefaultInterceptors();
  }

  // Interceptor management
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  private setupDefaultInterceptors() {
    // Default request interceptor for authentication
    this.addRequestInterceptor({
      onRequest: async (config) => {
        if (config.authenticated !== false) {
          const token = await authService.getIdToken();
          if (token) {
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${token}`,
            };
          }
        }
        return config;
      },
    });

    // Default response interceptor for error handling
    this.addResponseInterceptor({
      onResponseError: async (error) => {
        if (error instanceof ApiError && error.status === 401) {
          // Try to refresh the token
          const refreshResult = await authService.refreshTokens();
          if (!refreshResult.success) {
            // Redirect to login if refresh fails
            window.location.href = '/login';
          }
        }
        throw error;
      },
    });
  }

  private async runRequestInterceptors(config: RequestOptions): Promise<RequestOptions> {
    let finalConfig = config;

    for (const interceptor of this.requestInterceptors) {
      try {
        if (interceptor.onRequest) {
          finalConfig = await interceptor.onRequest(finalConfig);
        }
      } catch (error) {
        if (interceptor.onRequestError) {
          await interceptor.onRequestError(error);
        }
        throw error;
      }
    }

    return finalConfig;
  }

  private async runResponseInterceptors(response: Response): Promise<Response> {
    let finalResponse = response;

    for (const interceptor of this.responseInterceptors) {
      try {
        if (interceptor.onResponse) {
          finalResponse = await interceptor.onResponse(finalResponse);
        }
      } catch (error) {
        if (interceptor.onResponseError) {
          await interceptor.onResponseError(error);
        }
        throw error;
      }
    }

    return finalResponse;
  }

  private createApiError(message: string, status?: number, statusText?: string, data?: JSONValue): ApiError {
    const error = new ApiError(message);
    error.status = status;
    error.statusText = statusText;
    error.data = data;
    return error;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shouldRetry(error: unknown, attempt: number, maxRetries: number): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= maxRetries) return false;

    // Retry on network errors or specific status codes
    if (error instanceof TypeError && error.message === 'Failed to fetch') return true;
    if (error instanceof ApiError) {
      const retryableStatuses = [502, 503, 504, 408, 429];
      return retryableStatuses.includes(error.status || 0);
    }

    return false;
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      retries = DEFAULT_RETRY_COUNT,
      timeout = DEFAULT_TIMEOUT,
      cancelToken,
      ...fetchOptions
    } = options;

    // Set default headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    let config: RequestOptions = {
      ...fetchOptions,
      headers,
    };

    // Run request interceptors
    config = await this.runRequestInterceptors(config);

    const url = `${this.baseUrl}${endpoint}`;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        // Create abort controller for timeout and cancellation
        const abortController = cancelToken || new AbortController();

        // Set timeout
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, timeout);

        const response = await fetch(url, {
          ...config,
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        // Run response interceptors
        const processedResponse = await this.runResponseInterceptors(response);

        if (!processedResponse.ok) {
          const errorData = await processedResponse.text();
          let parsedError = null;

          try {
            parsedError = JSON.parse(errorData);
          } catch {
            // Not JSON, keep as text
          }

          throw this.createApiError(
            `API Error: ${processedResponse.status} ${processedResponse.statusText}`,
            processedResponse.status,
            processedResponse.statusText,
            parsedError || errorData
          );
        }

        // Parse response
        const contentType = processedResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await processedResponse.json();
        }

        return processedResponse.text() as unknown as T;
      } catch (error) {
        // Check if it's a timeout or cancellation
        if (error instanceof DOMException && error.name === 'AbortError') {
          if (cancelToken?.signal.aborted) {
            throw this.createApiError('Request was cancelled', 0, 'Cancelled');
          } else {
            throw this.createApiError('Request timeout', 0, 'Timeout');
          }
        }

        attempt++;

        // Determine if we should retry
        if (this.shouldRetry(error, attempt, retries)) {
          // Exponential backoff
          const delayMs = RETRY_DELAY * Math.pow(2, attempt - 1);
          await this.delay(delayMs);
          continue;
        }

        throw error;
      }
    }

    throw this.createApiError('Max retries exceeded', 0, 'RetryError');
  }

  // HTTP method shortcuts
  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create and export singleton instance
const API_BASE_URL = config.app.url.replace('http://localhost:3000', '') + '/api';
export const apiClient = new ApiClient(API_BASE_URL);
