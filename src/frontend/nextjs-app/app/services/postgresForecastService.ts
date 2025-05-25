import { apiClient } from './api/client';

export interface PostgresForecastData {
  restaurant_id: number;
  inventory_item_id: number;
  business_date: string;
  dma_id: string | null;
  dc_id: number | null;
  state: string;
  y_05: number;
  y_50: number;
  y_95: number;
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

export interface ForecastFilters {
  restaurantId?: number;
  inventoryItemId?: number;
  state?: string | string[];
  dmaId?: string | string[];
  dcId?: number | number[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

class PostgresForecastService {
  private readonly endpoint = '/api/data/postgres-forecast';

  /**
   * Execute a raw SQL query against the forecast_data table
   * This is mainly used for getting min/max dates
   */
  async executeQuery(query: string): Promise<{
    message: string;
    data: {
      columns: string[];
      rows: string[][];
    };
  }> {
    // Only allow safe SELECT queries on forecast_data table
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery.startsWith('select') || cleanQuery.includes(';')) {
      throw new Error('Only SELECT queries are allowed');
    }

    // Replace 'forecast' table name with 'forecast_data' for postgres
    const postgresQuery = query.replace(/\bforecast\b/gi, 'forecast_data');

    const response = await apiClient.post<{
      message: string;
      data: {
        columns: string[];
        rows: string[][];
      };
    }>(this.endpoint, {
      action: 'execute_query',
      query: postgresQuery
    });

    return response;
  }

  /**
   * Get forecast data with filters - optimized query
   */
  async getForecastData(filters?: ForecastFilters): Promise<PostgresForecastData[]> {
    const response = await apiClient.post<{ data: PostgresForecastData[] }>(
      this.endpoint,
      {
        action: 'get_forecast_data',
        filters
      }
    );
    return response.data;
  }

  /**
   * Get forecast summary statistics by state
   */
  async getForecastSummary(state?: string): Promise<ForecastSummary[]> {
    const response = await apiClient.post<{ data: ForecastSummary[] }>(
      this.endpoint,
      {
        action: 'get_forecast_summary',
        filters: { state }
      }
    );
    return response.data;
  }

  /**
   * Get forecast data aggregated by date
   */
  async getForecastByDate(
    startDate: string,
    endDate?: string,
    state?: string
  ): Promise<ForecastByDate[]> {
    const response = await apiClient.post<{ data: ForecastByDate[] }>(
      this.endpoint,
      {
        action: 'get_forecast_by_date',
        filters: {
          startDate,
          endDate,
          state
        }
      }
    );
    return response.data;
  }

  /**
   * Get distinct states - using indexed column
   */
  async getDistinctStates(): Promise<string[]> {
    const response = await apiClient.post<{ data: string[] }>(
      this.endpoint,
      {
        action: 'get_distinct_states'
      }
    );
    return response.data;
  }

  /**
   * Get distinct DMA IDs - using indexed column
   */
  async getDistinctDmaIds(): Promise<string[]> {
    const response = await apiClient.post<{ data: string[] }>(
      this.endpoint,
      {
        action: 'get_distinct_dma_ids'
      }
    );
    return response.data;
  }

  /**
   * Get distinct distribution center IDs - using indexed column
   */
  async getDistinctDcIds(): Promise<string[]> {
    const response = await apiClient.post<{ data: string[] }>(
      this.endpoint,
      {
        action: 'get_distinct_dc_ids'
      }
    );
    return response.data;
  }

  /**
   * Get distinct inventory item IDs - using indexed column
   */
  async getDistinctInventoryItems(): Promise<string[]> {
    const response = await apiClient.post<{ data: string[] }>(
      this.endpoint,
      {
        action: 'get_distinct_inventory_items'
      }
    );
    return response.data;
  }

  /**
   * Get distinct restaurant IDs - using indexed column
   */
  async getDistinctRestaurants(): Promise<string[]> {
    const response = await apiClient.post<{ data: string[] }>(
      this.endpoint,
      {
        action: 'get_distinct_restaurants'
      }
    );
    return response.data;
  }

  /**
   * Get forecast data for specific locations and time range
   * This is optimized for the dashboard view
   */
  async getDashboardForecast(
    states: string[],
    dmaIds?: string[],
    dcIds?: number[],
    startDate?: string,
    endDate?: string
  ): Promise<{
    data: PostgresForecastData[];
    summary: {
      totalRecords: number;
      avgForecast: number;
      dateRange: { min: string; max: string };
    };
  }> {
    const response = await apiClient.post<{
      data: PostgresForecastData[];
      summary: {
        totalRecords: number;
        avgForecast: number;
        dateRange: { min: string; max: string };
      };
    }>(this.endpoint, {
      action: 'get_dashboard_forecast',
      filters: {
        states,
        dmaIds,
        dcIds,
        startDate,
        endDate
      }
    });
    return response;
  }

  /**
   * Refresh materialized view for summary data
   */
  async refreshMaterializedView(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(this.endpoint, {
      action: 'refresh_materialized_view'
    });
    return response;
  }
}

export const postgresForecastService = new PostgresForecastService();
