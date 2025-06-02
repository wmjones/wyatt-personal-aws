import { forecastService } from '../forecastService';
import { postgresForecastService } from '../postgresForecastService';

// Mock the postgresForecastService
jest.mock('../postgresForecastService');

describe('ForecastService', () => {
  const mockPostgresForecastService = postgresForecastService as jest.Mocked<typeof postgresForecastService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('should forward query to postgresForecastService', async () => {
      const mockQuery = 'SELECT * FROM forecast_data LIMIT 10';
      const mockResponse = {
        message: 'Query executed successfully',
        data: {
          columns: ['col1', 'col2'],
          rows: [['val1', 'val2']]
        }
      };

      mockPostgresForecastService.executeQuery.mockResolvedValue(mockResponse);

      const result = await forecastService.executeQuery(mockQuery);

      expect(mockPostgresForecastService.executeQuery).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should handle query execution errors', async () => {
      const mockQuery = 'INVALID QUERY';
      const mockError = new Error('Query execution failed');

      mockPostgresForecastService.executeQuery.mockRejectedValue(mockError);

      await expect(forecastService.executeQuery(mockQuery)).rejects.toThrow('Query execution failed');
      expect(mockPostgresForecastService.executeQuery).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe('getForecastSummary', () => {
    it('should return forecast summary without state filter', async () => {
      const mockSummary = [
        {
          state: 'CA',
          recordCount: 1000,
          avgForecast: 150.5,
          minForecast: 10.0,
          maxForecast: 500.0
        }
      ];

      mockPostgresForecastService.getForecastSummary.mockResolvedValue(mockSummary);

      const result = await forecastService.getForecastSummary();

      expect(mockPostgresForecastService.getForecastSummary).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockSummary);
    });

    it('should return forecast summary with state filter', async () => {
      const mockState = 'TX';
      const mockSummary = [
        {
          state: 'TX',
          recordCount: 500,
          avgForecast: 200.0,
          minForecast: 20.0,
          maxForecast: 600.0
        }
      ];

      mockPostgresForecastService.getForecastSummary.mockResolvedValue(mockSummary);

      const result = await forecastService.getForecastSummary(mockState);

      expect(mockPostgresForecastService.getForecastSummary).toHaveBeenCalledWith(mockState);
      expect(result).toEqual(mockSummary);
    });
  });

  describe('getForecastByDate', () => {
    it('should return forecast data by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const mockForecast = [
        { businessDate: '2024-01-01', avgForecast: 100 },
        { businessDate: '2024-01-02', avgForecast: 110 }
      ];

      mockPostgresForecastService.getForecastByDate.mockResolvedValue(mockForecast);

      const result = await forecastService.getForecastByDate(startDate, endDate);

      expect(mockPostgresForecastService.getForecastByDate).toHaveBeenCalledWith(startDate, endDate, undefined);
      expect(result).toEqual(mockForecast);
    });

    it('should handle date range with state filter', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const state = 'CA';
      const mockForecast = [
        { businessDate: '2024-01-01', avgForecast: 120 }
      ];

      mockPostgresForecastService.getForecastByDate.mockResolvedValue(mockForecast);

      const result = await forecastService.getForecastByDate(startDate, endDate, state);

      expect(mockPostgresForecastService.getForecastByDate).toHaveBeenCalledWith(startDate, endDate, state);
      expect(result).toEqual(mockForecast);
    });

    it('should handle missing end date', async () => {
      const startDate = '2024-01-01';
      const mockForecast = [
        { businessDate: '2024-01-01', avgForecast: 100 }
      ];

      mockPostgresForecastService.getForecastByDate.mockResolvedValue(mockForecast);

      const result = await forecastService.getForecastByDate(startDate);

      expect(mockPostgresForecastService.getForecastByDate).toHaveBeenCalledWith(startDate, undefined, undefined);
      expect(result).toEqual(mockForecast);
    });
  });

  describe('getForecastData', () => {
    it('should transform forecast data to Athena response format', async () => {
      const mockFilters = {
        inventoryItemId: 1,
        state: 'CA',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockData = [
        {
          restaurant_id: 123,
          inventory_item_id: 1,
          business_date: '2024-01-01',
          dma_id: 'DMA-1',
          dc_id: 101,
          state: 'CA',
          y_05: 10.5,
          y_50: 50.0,
          y_95: 90.5
        }
      ];

      mockPostgresForecastService.getForecastData.mockResolvedValue(mockData);

      const result = await forecastService.getForecastData(mockFilters);

      expect(mockPostgresForecastService.getForecastData).toHaveBeenCalledWith(mockFilters);
      expect(result).toEqual({
        message: 'Query executed successfully',
        data: {
          columns: ['restaurant_id', 'inventory_item_id', 'business_date', 'dma_id', 'dc_id', 'state', 'y_05', 'y_50', 'y_95'],
          rows: [['123', '1', '2024-01-01', 'DMA-1', '101', 'CA', '10.5', '50', '90.5']]
        }
      });
    });

    it('should handle null values in transformation', async () => {
      const mockData = [
        {
          restaurant_id: 123,
          inventory_item_id: 1,
          business_date: '2024-01-01',
          dma_id: null,
          dc_id: null,
          state: 'CA',
          y_05: 10.5,
          y_50: 50.0,
          y_95: 90.5
        }
      ];

      mockPostgresForecastService.getForecastData.mockResolvedValue(mockData);

      const result = await forecastService.getForecastData();

      expect(result.data.rows[0]).toEqual(['123', '1', '2024-01-01', '', '', 'CA', '10.5', '50', '90.5']);
    });

    it('should handle multiple filter types', async () => {
      const mockFilters = {
        state: ['CA', 'TX'],
        dmaId: ['DMA-1', 'DMA-2'],
        dcId: [101, 102],
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 5000
      };

      mockPostgresForecastService.getForecastData.mockResolvedValue([]);

      await forecastService.getForecastData(mockFilters);

      expect(mockPostgresForecastService.getForecastData).toHaveBeenCalledWith(mockFilters);
    });

    it('should handle empty result set', async () => {
      mockPostgresForecastService.getForecastData.mockResolvedValue([]);

      const result = await forecastService.getForecastData({ state: 'INVALID' });

      expect(result).toEqual({
        message: 'Query executed successfully',
        data: {
          columns: ['restaurant_id', 'inventory_item_id', 'business_date', 'dma_id', 'dc_id', 'state', 'y_05', 'y_50', 'y_95'],
          rows: []
        }
      });
    });
  });

  describe('getDistinct methods', () => {
    it('should get distinct states', async () => {
      const mockStates = ['CA', 'TX', 'NY'];
      mockPostgresForecastService.getDistinctStates.mockResolvedValue(mockStates);

      const result = await forecastService.getDistinctStates();

      expect(mockPostgresForecastService.getDistinctStates).toHaveBeenCalled();
      expect(result).toEqual(mockStates);
    });

    it('should get distinct DMA IDs', async () => {
      const mockDmaIds = ['DMA-1', 'DMA-2', 'DMA-3'];
      mockPostgresForecastService.getDistinctDmaIds.mockResolvedValue(mockDmaIds);

      const result = await forecastService.getDistinctDmaIds();

      expect(mockPostgresForecastService.getDistinctDmaIds).toHaveBeenCalled();
      expect(result).toEqual(mockDmaIds);
    });

    it('should get distinct DC IDs', async () => {
      const mockDcIds = ['101', '102', '103'];
      mockPostgresForecastService.getDistinctDcIds.mockResolvedValue(mockDcIds);

      const result = await forecastService.getDistinctDcIds();

      expect(mockPostgresForecastService.getDistinctDcIds).toHaveBeenCalled();
      expect(result).toEqual(mockDcIds);
    });

    it('should get distinct inventory items', async () => {
      const mockItems = ['1', '2', '3', '4', '5'];
      mockPostgresForecastService.getDistinctInventoryItems.mockResolvedValue(mockItems);

      const result = await forecastService.getDistinctInventoryItems();

      expect(mockPostgresForecastService.getDistinctInventoryItems).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should get distinct restaurants', async () => {
      const mockRestaurants = ['123', '456', '789'];
      mockPostgresForecastService.getDistinctRestaurants.mockResolvedValue(mockRestaurants);

      const result = await forecastService.getDistinctRestaurants();

      expect(mockPostgresForecastService.getDistinctRestaurants).toHaveBeenCalled();
      expect(result).toEqual(mockRestaurants);
    });
  });

  describe('getDashboardForecast', () => {
    it('should get dashboard forecast with required states', async () => {
      const states = ['CA', 'TX'];
      const mockResponse = {
        data: [],
        summary: {
          totalRecords: 1000,
          avgForecast: 150.5,
          dateRange: { min: '2024-01-01', max: '2024-01-31' }
        }
      };

      mockPostgresForecastService.getDashboardForecast.mockResolvedValue(mockResponse);

      const result = await forecastService.getDashboardForecast(states);

      expect(mockPostgresForecastService.getDashboardForecast).toHaveBeenCalledWith(states, undefined, undefined, undefined, undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should get dashboard forecast with all filters', async () => {
      const states = ['CA'];
      const dmaIds = ['DMA-1', 'DMA-2'];
      const dcIds = [101, 102];
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockResponse = {
        data: [
          {
            restaurant_id: 1,
            inventory_item_id: 1,
            business_date: '2024-01-01',
            dma_id: 'DMA-1',
            dc_id: 101,
            state: 'CA',
            y_05: 10,
            y_50: 50,
            y_95: 90
          }
        ],
        summary: {
          totalRecords: 1,
          avgForecast: 50,
          dateRange: { min: '2024-01-01', max: '2024-01-01' }
        }
      };

      mockPostgresForecastService.getDashboardForecast.mockResolvedValue(mockResponse);

      const result = await forecastService.getDashboardForecast(states, dmaIds, dcIds, startDate, endDate);

      expect(mockPostgresForecastService.getDashboardForecast).toHaveBeenCalledWith(states, dmaIds, dcIds, startDate, endDate);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty states array', async () => {
      const states: string[] = [];
      const mockResponse = { data: [], summary: { totalRecords: 0, avgForecast: 0, dateRange: { min: '', max: '' } } };

      mockPostgresForecastService.getDashboardForecast.mockResolvedValue(mockResponse);

      const result = await forecastService.getDashboardForecast(states);

      expect(mockPostgresForecastService.getDashboardForecast).toHaveBeenCalledWith(states, undefined, undefined, undefined, undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should propagate network errors', async () => {
      const networkError = new Error('Network error: Failed to fetch');
      mockPostgresForecastService.getForecastData.mockRejectedValue(networkError);

      await expect(forecastService.getForecastData({})).rejects.toThrow('Network error: Failed to fetch');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockPostgresForecastService.executeQuery.mockRejectedValue(timeoutError);

      await expect(forecastService.executeQuery('SELECT 1')).rejects.toThrow('Request timeout');
    });

    it('should handle API errors', async () => {
      const apiError = new Error('API Error: Invalid parameters');
      mockPostgresForecastService.getDashboardForecast.mockRejectedValue(apiError);

      await expect(forecastService.getDashboardForecast(['CA'])).rejects.toThrow('API Error: Invalid parameters');
    });
  });
});
