import { cacheService } from '../cacheService';
import { apiClient } from '../api/client';

// Mock the API client
jest.mock('../api/client');

describe('CacheService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
  const baseUrl = '/api/forecast/cache';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCachedSummary', () => {
    it('should return cached summary data on cache hit', async () => {
      const fingerprint = 'test_fingerprint_123';
      const mockCacheEntry = {
        id: 1,
        cache_key: 'summary_test',
        query_fingerprint: fingerprint,
        data: { state: 'CA', avgForecast: 150.5 },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-01-02T00:00:00Z',
        hit_count: 5
      };

      mockApiClient.get.mockResolvedValue({ data: mockCacheEntry });

      const result = await cacheService.getCachedSummary(fingerprint);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `${baseUrl}?action=get_summary&fingerprint=${encodeURIComponent(fingerprint)}`
      );
      expect(result).toEqual(mockCacheEntry);
    });

    it('should return null on cache miss', async () => {
      const fingerprint = 'non_existent_fingerprint';
      mockApiClient.get.mockResolvedValue({ data: null });

      const result = await cacheService.getCachedSummary(fingerprint);

      expect(result).toBeNull();
    });

    it('should handle errors gracefully and return null', async () => {
      const fingerprint = 'test_fingerprint';
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      const result = await cacheService.getCachedSummary(fingerprint);

      expect(console.error).toHaveBeenCalledWith('Error getting cached summary:', error);
      expect(result).toBeNull();
    });

    it('should properly encode fingerprint in URL', async () => {
      const fingerprint = 'test/fingerprint#with&special=chars';
      mockApiClient.get.mockResolvedValue({ data: null });

      await cacheService.getCachedSummary(fingerprint);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `${baseUrl}?action=get_summary&fingerprint=${encodeURIComponent(fingerprint)}`
      );
    });
  });

  describe('getCachedTimeseries', () => {
    it('should return cached timeseries data on cache hit', async () => {
      const fingerprint = 'timeseries_fingerprint';
      const mockCacheEntry = {
        id: 2,
        cache_key: 'timeseries_test',
        query_fingerprint: fingerprint,
        data: [
          { businessDate: '2024-01-01', avgForecast: 100 },
          { businessDate: '2024-01-02', avgForecast: 110 }
        ],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-01-02T00:00:00Z',
        hit_count: 10
      };

      mockApiClient.get.mockResolvedValue({ data: mockCacheEntry });

      const result = await cacheService.getCachedTimeseries(fingerprint);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `${baseUrl}?action=get_timeseries&fingerprint=${encodeURIComponent(fingerprint)}`
      );
      expect(result).toEqual(mockCacheEntry);
    });

    it('should handle API errors and return null', async () => {
      const fingerprint = 'test_fingerprint';
      const error = new Error('API Error');
      mockApiClient.get.mockRejectedValue(error);

      const result = await cacheService.getCachedTimeseries(fingerprint);

      expect(console.error).toHaveBeenCalledWith('Error getting cached timeseries:', error);
      expect(result).toBeNull();
    });
  });

  describe('cacheSummaryResult', () => {
    it('should cache summary data successfully', async () => {
      const queryType = 'get_forecast_summary';
      const filters = { state: ['CA', 'TX'] };
      const data = { avgForecast: 150, recordCount: 1000 };

      mockApiClient.post.mockResolvedValue({ success: true });

      await cacheService.cacheSummaryResult(queryType, filters, data);

      expect(mockApiClient.post).toHaveBeenCalledWith(baseUrl, {
        action: 'cache_summary',
        data: {
          queryType,
          filters,
          summaryData: data
        }
      });
    });

    it('should handle caching errors gracefully', async () => {
      const queryType = 'get_forecast_summary';
      const filters = { state: ['CA'] };
      const data = { avgForecast: 100 };
      const error = new Error('Cache write failed');

      mockApiClient.post.mockRejectedValue(error);

      await cacheService.cacheSummaryResult(queryType, filters, data);

      expect(console.error).toHaveBeenCalledWith('Error caching summary result:', error);
      // Should not throw, just log error
    });

    it('should handle large data sets', async () => {
      const queryType = 'get_forecast_summary';
      const filters = { state: Array(50).fill('CA') }; // Large filter array
      const data = Array(1000).fill({ avgForecast: 100 }); // Large data array

      mockApiClient.post.mockResolvedValue({ success: true });

      await cacheService.cacheSummaryResult(queryType, filters, data);

      expect(mockApiClient.post).toHaveBeenCalledWith(baseUrl, {
        action: 'cache_summary',
        data: {
          queryType,
          filters,
          summaryData: data
        }
      });
    });
  });

  describe('cacheTimeseriesResult', () => {
    it('should cache timeseries data successfully', async () => {
      const queryType = 'get_forecast_by_date';
      const filters = { startDate: '2024-01-01', endDate: '2024-01-31' };
      const data = [
        { businessDate: '2024-01-01', avgForecast: 100 },
        { businessDate: '2024-01-02', avgForecast: 110 }
      ];

      mockApiClient.post.mockResolvedValue({ success: true });

      await cacheService.cacheTimeseriesResult(queryType, filters, data);

      expect(mockApiClient.post).toHaveBeenCalledWith(baseUrl, {
        action: 'cache_timeseries',
        data: {
          queryType,
          filters,
          timeseriesData: data
        }
      });
    });

    it('should handle empty data arrays', async () => {
      const queryType = 'get_forecast_by_date';
      const filters = { startDate: '2024-01-01', endDate: '2024-01-31' };
      const data: unknown[] = [];

      mockApiClient.post.mockResolvedValue({ success: true });

      await cacheService.cacheTimeseriesResult(queryType, filters, data);

      expect(mockApiClient.post).toHaveBeenCalledWith(baseUrl, {
        action: 'cache_timeseries',
        data: {
          queryType,
          filters,
          timeseriesData: data
        }
      });
    });
  });

  describe('recordQueryMetrics', () => {
    it('should record query metrics successfully', async () => {
      const metrics = {
        query_fingerprint: 'test_fingerprint',
        query_type: 'get_forecast_data',
        execution_time_ms: 150,
        data_source: 'cache' as const,
        cache_hit: true,
        error_occurred: false,
        user_id: 'user123',
        filters: { state: ['CA'] }
      };

      mockApiClient.post.mockResolvedValue({ success: true });

      await cacheService.recordQueryMetrics(metrics);

      expect(mockApiClient.post).toHaveBeenCalledWith(baseUrl, {
        action: 'record_metrics',
        data: { metrics }
      });
    });

    it('should handle metrics recording errors', async () => {
      const metrics = {
        query_fingerprint: 'test_fingerprint',
        query_type: 'get_forecast_data',
        execution_time_ms: 150,
        data_source: 'database' as const,
        cache_hit: false,
        error_occurred: true
      };
      const error = new Error('Metrics recording failed');

      mockApiClient.post.mockRejectedValue(error);

      await cacheService.recordQueryMetrics(metrics);

      expect(console.error).toHaveBeenCalledWith('Error recording query metrics:', error);
    });

    it('should handle different data sources', async () => {
      const dataSources = ['cache', 'athena', 'database'] as const;

      for (const dataSource of dataSources) {
        const metrics = {
          query_fingerprint: `test_${dataSource}`,
          query_type: 'get_forecast_data',
          execution_time_ms: 100,
          data_source: dataSource,
          cache_hit: dataSource === 'cache',
          error_occurred: false
        };

        mockApiClient.post.mockResolvedValue({ success: true });
        await cacheService.recordQueryMetrics(metrics);

        expect(mockApiClient.post).toHaveBeenCalledWith(baseUrl, {
          action: 'record_metrics',
          data: { metrics }
        });
      }
    });
  });

  describe('incrementCacheHit', () => {
    it('should increment cache hit counter successfully', async () => {
      const tableName = 'summary_cache';
      const cacheId = 123;

      mockApiClient.post.mockResolvedValue({ success: true });

      await cacheService.incrementCacheHit(tableName, cacheId);

      expect(mockApiClient.post).toHaveBeenCalledWith(baseUrl, {
        action: 'increment_hit',
        data: { tableName, cacheId }
      });
    });

    it('should handle different table names', async () => {
      const tableNames = ['summary_cache', 'timeseries_cache'];

      for (const tableName of tableNames) {
        mockApiClient.post.mockResolvedValue({ success: true });
        await cacheService.incrementCacheHit(tableName, 456);

        expect(mockApiClient.post).toHaveBeenCalledWith(baseUrl, {
          action: 'increment_hit',
          data: { tableName, cacheId: 456 }
        });
      }
    });

    it('should handle increment errors gracefully', async () => {
      const error = new Error('Database error');
      mockApiClient.post.mockRejectedValue(error);

      await cacheService.incrementCacheHit('summary_cache', 123);

      expect(console.error).toHaveBeenCalledWith('Error incrementing cache hit:', error);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics successfully', async () => {
      const mockStats = {
        hitRate: 0.85,
        totalQueries: 10000,
        avgResponseTime: 45.5,
        cacheSize: 1024000
      };

      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await cacheService.getCacheStats();

      expect(mockApiClient.get).toHaveBeenCalledWith(`${baseUrl}?action=get_stats`);
      expect(result).toEqual(mockStats);
    });

    it('should return default stats on error', async () => {
      const error = new Error('Stats unavailable');
      mockApiClient.get.mockRejectedValue(error);

      const result = await cacheService.getCacheStats();

      expect(console.error).toHaveBeenCalledWith('Error getting cache stats:', error);
      expect(result).toEqual({
        hitRate: 0,
        totalQueries: 0,
        avgResponseTime: 0,
        cacheSize: 0
      });
    });

    it('should handle zero values in stats', async () => {
      const mockStats = {
        hitRate: 0,
        totalQueries: 0,
        avgResponseTime: 0,
        cacheSize: 0
      };

      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await cacheService.getCacheStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe('clearExpiredCache', () => {
    it('should clear expired cache entries successfully', async () => {
      mockApiClient.post.mockResolvedValue({ success: true, cleared: 50 });

      await cacheService.clearExpiredCache();

      expect(mockApiClient.post).toHaveBeenCalledWith(baseUrl, {
        action: 'clear_expired',
        data: {}
      });
    });

    it('should handle clear cache errors gracefully', async () => {
      const error = new Error('Clear cache failed');
      mockApiClient.post.mockRejectedValue(error);

      await cacheService.clearExpiredCache();

      expect(console.error).toHaveBeenCalledWith('Error clearing expired cache:', error);
      // Should not throw
    });

    it('should handle timeout during cache clearing', async () => {
      const timeoutError = new Error('Request timeout');
      mockApiClient.post.mockRejectedValue(timeoutError);

      await cacheService.clearExpiredCache();

      expect(console.error).toHaveBeenCalledWith('Error clearing expired cache:', timeoutError);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors consistently across all methods', async () => {
      const networkError = new Error('Network unavailable');
      mockApiClient.get.mockRejectedValue(networkError);
      mockApiClient.post.mockRejectedValue(networkError);

      // Test all methods
      await cacheService.getCachedSummary('test');
      await cacheService.getCachedTimeseries('test');
      await cacheService.cacheSummaryResult('type', {}, {});
      await cacheService.cacheTimeseriesResult('type', {}, []);
      await cacheService.recordQueryMetrics({
        query_fingerprint: 'test',
        query_type: 'test',
        execution_time_ms: 0,
        data_source: 'cache',
        cache_hit: false,
        error_occurred: true
      });
      await cacheService.incrementCacheHit('table', 1);
      await cacheService.getCacheStats();
      await cacheService.clearExpiredCache();

      // All methods should handle errors gracefully
      expect(console.error).toHaveBeenCalledTimes(8);
    });

    it('should handle malformed API responses', async () => {
      // Return undefined instead of expected structure
      mockApiClient.get.mockResolvedValue(undefined as unknown as { data: unknown });

      const summaryResult = await cacheService.getCachedSummary('test');
      // The service checks response.data, so undefined response would result in an error
      expect(summaryResult).toBeNull(); // getCachedSummary returns null on error

      const statsResult = await cacheService.getCacheStats();
      // getCacheStats also tries to access response.data, causing an error
      // It returns default stats object on error
      expect(statsResult).toEqual({
        hitRate: 0,
        totalQueries: 0,
        avgResponseTime: 0,
        cacheSize: 0
      });
    });
  });
});
