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

export interface ForecastTimeSeries {
  business_date: string;
  inventory_item_id: string;
  state: string;
  dma_id: string;
  dc_id: string;
  y_05: number;
  y_50: number;
  y_95: number;
}

export interface ForecastData {
  summary: ForecastSummary[];
  timeSeries: ForecastTimeSeries[];
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
