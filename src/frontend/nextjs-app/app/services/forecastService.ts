import { postgresForecastService } from './postgresForecastService';

// Export the Postgres forecast service directly
export const forecastService = {
  // Map Postgres service methods to match service interface
  async executeQuery(query: string) {
    return postgresForecastService.executeQuery(query);
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
    dmaId?: string | string[];
    dcId?: number | number[];
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
          String(row.restaurant_id),
          String(row.inventory_item_id),
          row.business_date,
          row.dma_id || '',
          row.dc_id != null ? String(row.dc_id) : '',
          row.state,
          String(row.y_05),
          String(row.y_50),
          String(row.y_95)
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
};

// Export the service type
export type ForecastService = typeof forecastService;
