import { generateClient } from 'aws-amplify/api';

// Types for visualization parameters
export interface VisualizationParameters {
  paramId: string;
  userId: string;
  mean: number;
  stdDev: number;
  timestamp?: number;
  version?: string;
  lastUpdatedBy?: string;
}

// Types for parameter history
export interface ParameterHistory {
  userId: string;
  timestamp: number;
  paramId: string;
  paramName: string;
  oldValue: string | number;
  newValue: string | number;
  updatedBy: string;
}

// Types for WebSocket connection
export interface ConnectionInfo {
  connectionId: string;
  userId: string;
  timestamp: number;
  ttl?: number;
}

// Create API client
const client = generateClient();

// API service class
class APIService {
  // Get parameters for a specific visualization
  async getVisualizationParameters(paramId: string, userId: string): Promise<VisualizationParameters> {
    try {
      // In production, this would call the actual API
      // const response = await client.get('api', `/parameters/${paramId}`, { queryStringParameters: { userId } });
      // return response;

      // For now, return mock data
      return {
        paramId,
        userId,
        mean: 0,
        stdDev: 1,
        timestamp: Date.now(),
        version: 'v1',
        lastUpdatedBy: 'System'
      };
    } catch (error) {
      console.error('Error fetching visualization parameters:', error);
      throw error;
    }
  }

  // Update parameters for a visualization
  async updateVisualizationParameters(params: VisualizationParameters): Promise<VisualizationParameters> {
    try {
      // In production, this would call the actual API
      // const response = await client.put('api', `/parameters/${params.paramId}`, { body: params });
      // return response;

      // For now, return the input with a timestamp
      return {
        ...params,
        timestamp: Date.now(),
        version: `v${Math.floor(Math.random() * 10) + 1}`,
        lastUpdatedBy: params.userId
      };
    } catch (error) {
      console.error('Error updating visualization parameters:', error);
      throw error;
    }
  }

  // Get parameter history for a user
  async getParameterHistory(userId: string, paramId?: string): Promise<ParameterHistory[]> {
    try {
      // In production, this would call the actual API
      // const path = paramId ? `/history/${userId}/${paramId}` : `/history/${userId}`;
      // const response = await client.get('api', path, {});
      // return response;

      // For now, return mock data
      return [
        {
          userId,
          timestamp: Date.now() - 1000 * 60 * 5,
          paramId: paramId || 'normal_distribution_params',
          paramName: 'mean',
          oldValue: 0,
          newValue: 0.5,
          updatedBy: userId
        },
        {
          userId,
          timestamp: Date.now() - 1000 * 60 * 10,
          paramId: paramId || 'normal_distribution_params',
          paramName: 'stdDev',
          oldValue: 1,
          newValue: 1.2,
          updatedBy: userId
        }
      ];
    } catch (error) {
      console.error('Error fetching parameter history:', error);
      throw error;
    }
  }

  // Connect to WebSocket API
  async connectWebSocket(): Promise<string> {
    try {
      // In production, this would set up a WebSocket connection
      // const response = await client.post('api', '/connect', {});
      // return response.connectionId;

      // For now, return a mock connection ID
      return `ws-${Math.random().toString(36).substring(2, 15)}`;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      throw error;
    }
  }

  // Disconnect from WebSocket API
  async disconnectWebSocket(connectionId: string): Promise<void> {
    try {
      // In production, this would close the WebSocket connection
      // await client.post('api', '/disconnect', { body: { connectionId } });

      // For now, just log
      console.log(`Disconnected from WebSocket: ${connectionId}`);
    } catch (error) {
      console.error('Error disconnecting from WebSocket:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const apiService = new APIService();
