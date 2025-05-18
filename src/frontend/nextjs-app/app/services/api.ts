import { apiClient } from './api/client';
import { installLoggingInterceptor } from './api/interceptors/logging';
import type { Visualization, User, CreateVisualizationDto, UpdateVisualizationDto } from '../types/api';

// Install logging interceptor
installLoggingInterceptor(apiClient);

// API service wrapper for specific endpoints
class ApiService {
  // Visualization endpoints
  async getVisualizations() {
    return apiClient.get<Visualization[]>('/visualizations');
  }

  async getVisualization(id: string) {
    return apiClient.get<Visualization>(`/visualizations/${id}`);
  }

  async createVisualization(data: CreateVisualizationDto) {
    return apiClient.post<Visualization>('/visualizations', data);
  }

  async updateVisualization(id: string, data: UpdateVisualizationDto) {
    return apiClient.put<Visualization>(`/visualizations/${id}`, data);
  }

  async deleteVisualization(id: string) {
    return apiClient.delete<void>(`/visualizations/${id}`);
  }

  // User profile endpoints
  async getUserProfile() {
    return apiClient.get<User>('/user/profile');
  }

  async updateUserProfile(data: Partial<User>) {
    return apiClient.put<User>('/user/profile', data);
  }

  // WebSocket connection for real-time updates
  getWebSocketUrl(token?: string) {
    const baseWsUrl = apiClient['baseUrl'].replace('http', 'ws').replace('/api', '');
    const wsUrl = `${baseWsUrl}/ws`;

    if (token) {
      return `${wsUrl}?token=${token}`;
    }

    return wsUrl;
  }

  // Export the raw client for custom requests
  get client() {
    return apiClient;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export a hook for using the API in components
export function useApi() {
  return apiService;
}

// Export error utilities
export * from './api/errors';

// Export types and classes
export type { RequestOptions } from './api/client';
export { ApiError } from './api/client';
