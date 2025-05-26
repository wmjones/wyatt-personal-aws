/**
 * Shared types for forecast services
 */

export interface QueryResponse {
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

export interface ForecastFilters {
  restaurantId?: number;
  inventoryItemId?: number;
  state?: string | string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}
