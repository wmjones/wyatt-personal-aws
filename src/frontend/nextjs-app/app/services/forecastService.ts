import { athenaService } from './athenaService';
import { postgresForecastService } from './postgresForecastService';

// Feature flag to switch between Athena and Postgres
const USE_POSTGRES = process.env.NEXT_PUBLIC_USE_POSTGRES_FORECAST === 'true';

// Export a unified forecast service that switches based on the feature flag
export const forecastService = USE_POSTGRES ? {
  // Map Postgres service methods to match Athena service interface
  async executeQuery(_query: string) { // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new Error('Direct SQL queries not supported with Postgres service. Use specific methods instead.');
  },

  async getForecastSummary(state?: string) {
    return postgresForecastService.getForecastSummary(state);
  },

  async getForecastByDate(startDate: string, endDate?: string, state?: string) {
    return postgresForecastService.getForecastByDate(startDate, endDate, state);
  },

  async getForecastData(filters?: {
    restaurantId?: number;
    inventoryItemId?: number;
    state?: string | string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const data = await postgresForecastService.getForecastData(filters);
    // Transform to match Athena response format
    return {
      message: 'Query executed successfully',
      data: {
        columns: ['restaurant_id', 'inventory_item_id', 'business_date', 'dma_id', 'dc_id', 'state', 'y_05', 'y_50', 'y_95'],
        rows: data.map(row => [
          row.restaurant_id.toString(),
          row.inventory_item_id.toString(),
          row.business_date,
          row.dma_id || '',
          row.dc_id?.toString() || '',
          row.state,
          row.y_05.toString(),
          row.y_50.toString(),
          row.y_95.toString()
        ])
      }
    };
  },

  async getDistinctStates() {
    return postgresForecastService.getDistinctStates();
  },

  async getDistinctDmaIds() {
    return postgresForecastService.getDistinctDmaIds();
  },

  async getDistinctDcIds() {
    return postgresForecastService.getDistinctDcIds();
  },

  async getDistinctInventoryItems() {
    return postgresForecastService.getDistinctInventoryItems();
  },

  async getDistinctRestaurants() {
    return postgresForecastService.getDistinctRestaurants();
  },

  // Additional method for optimized dashboard queries
  async getDashboardForecast(states: string[], dmaIds?: string[], dcIds?: number[], startDate?: string, endDate?: string) {
    return postgresForecastService.getDashboardForecast(states, dmaIds, dcIds, startDate, endDate);
  }
} : athenaService;

// Export the service type
export type ForecastService = typeof forecastService;
