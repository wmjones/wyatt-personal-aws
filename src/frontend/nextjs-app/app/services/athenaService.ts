import { apiClient } from './api/client';

export interface AthenaQueryRequest {
  action: 'execute_query' | 'get_forecast_summary' | 'get_forecast_by_date';
  query?: string;
  filters?: {
    state?: string;
    start_date?: string;
    end_date?: string;
  };
}

export interface AthenaQueryResponse {
  message: string;
  data: {
    columns: string[];
    rows: string[][];
  };
}

export interface ForecastSummary {
  state: string;
  recordCount: number;
  avgForecast: number;
  minForecast: number;
  maxForecast: number;
}

export interface ForecastByDate {
  businessDate: string;
  avgForecast: number;
}

class AthenaService {
  private readonly endpoint = '/api/data/athena/query';

  /**
   * Execute a custom Athena query
   */
  async executeQuery(query: string): Promise<AthenaQueryResponse> {
    const request: AthenaQueryRequest = {
      action: 'execute_query',
      query
    };

    return apiClient.post<AthenaQueryResponse>(this.endpoint, request);
  }

  /**
   * Get forecast summary statistics by state
   */
  async getForecastSummary(state?: string): Promise<ForecastSummary[]> {
    const request: AthenaQueryRequest = {
      action: 'get_forecast_summary',
      filters: state ? { state } : undefined
    };

    const response = await apiClient.post<AthenaQueryResponse>(this.endpoint, request);

    // Transform the raw data into typed objects
    return response.data.rows.map(row => ({
      state: row[0],
      recordCount: parseInt(row[1], 10),
      avgForecast: parseFloat(row[2]),
      minForecast: parseFloat(row[3]),
      maxForecast: parseFloat(row[4])
    }));
  }

  /**
   * Get forecast data by date range
   */
  async getForecastByDate(
    startDate: string,
    endDate?: string,
    state?: string
  ): Promise<ForecastByDate[]> {
    const request: AthenaQueryRequest = {
      action: 'get_forecast_by_date',
      filters: {
        start_date: startDate,
        end_date: endDate,
        state
      }
    };

    const response = await apiClient.post<AthenaQueryResponse>(this.endpoint, request);

    // Transform the raw data into typed objects
    return response.data.rows.map(row => ({
      businessDate: row[0],
      avgForecast: parseFloat(row[1])
    }));
  }

  /**
   * Get raw forecast data with optional filters
   */
  async getForecastData(filters?: {
    restaurantId?: number;
    inventoryItemId?: number;
    state?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AthenaQueryResponse> {
    let query = 'SELECT * FROM forecast';
    const conditions: string[] = [];

    if (filters) {
      if (filters.restaurantId) {
        conditions.push(`restaurant_id = ${filters.restaurantId}`);
      }
      if (filters.inventoryItemId) {
        conditions.push(`inventory_item_id = ${filters.inventoryItemId}`);
      }
      if (filters.state) {
        conditions.push(`state = '${filters.state}'`);
      }
      if (filters.startDate) {
        conditions.push(`business_date >= '${filters.startDate}'`);
      }
      if (filters.endDate) {
        conditions.push(`business_date <= '${filters.endDate}'`);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY business_date DESC';

    if (filters?.limit) {
      query += ` LIMIT ${filters.limit}`;
    }

    return this.executeQuery(query);
  }
}

export const athenaService = new AthenaService();
