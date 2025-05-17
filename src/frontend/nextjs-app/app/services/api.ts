import { config } from '../lib/config';
import { authService } from './auth';

const API_BASE_URL = config.app.url.replace('http://localhost:3000', '') + '/api';

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders() {
    const token = await authService.getIdToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { authenticated = true, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (authenticated) {
      const authHeaders = await this.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, try to refresh
          const refreshResult = await authService.refreshTokens();

          if (refreshResult.success) {
            // Retry the request with new token
            const newAuthHeaders = await this.getAuthHeaders();
            Object.assign(headers, newAuthHeaders);

            const retryResponse = await fetch(url, {
              ...fetchOptions,
              headers,
            });

            if (!retryResponse.ok) {
              throw new Error(`API Error: ${retryResponse.status} ${retryResponse.statusText}`);
            }

            return await retryResponse.json();
          } else {
            // Refresh failed, redirect to login
            window.location.href = '/login';
            throw new Error('Authentication failed');
          }
        }

        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Visualization endpoints
  async getVisualizations() {
    return this.request<any[]>('/visualizations');
  }

  async getVisualization(id: string) {
    return this.request<any>(`/visualizations/${id}`);
  }

  async createVisualization(data: any) {
    return this.request<any>('/visualizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVisualization(id: string, data: any) {
    return this.request<any>(`/visualizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVisualization(id: string) {
    return this.request<any>(`/visualizations/${id}`, {
      method: 'DELETE',
    });
  }

  // User profile endpoints
  async getUserProfile() {
    return this.request<any>('/user/profile');
  }

  async updateUserProfile(data: any) {
    return this.request<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // WebSocket connection for real-time updates
  getWebSocketUrl() {
    // This will be configured based on your AWS WebSocket API Gateway
    return config.app.url.replace('http', 'ws') + '/ws';
  }
}

// Create and export a singleton instance
export const apiService = new ApiService(API_BASE_URL);

// Export a hook for using the API in components
export function useApi() {
  return apiService;
}
