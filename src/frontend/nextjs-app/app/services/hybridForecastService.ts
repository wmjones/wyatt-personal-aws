/**
 * Hybrid Forecast Service
 *
 * This service implements the hybrid architecture that intelligently routes
 * forecast data queries between cached data (hot path) and direct Athena queries (cold path).
 */

import { forecastService } from './forecastService';
import { ForecastSummary, ForecastByDate, AthenaQueryResponse } from './athenaService';
import { cacheService } from './cacheService';
import { cacheUtils, QueryFilters } from '../lib/cache-utils';

/**
 * Cache entry interface
 */
interface CacheEntry<T = unknown> {
  id: number;
  cache_key: string;
  query_fingerprint: string;
  data: T;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
  hit_count: number;
}

/**
 * Query metrics interface
 */
interface QueryMetrics {
  query_fingerprint: string;
  query_type: string;
  execution_time_ms: number;
  data_source: 'cache' | 'athena';
  cache_hit: boolean;
  error_occurred: boolean;
  user_id?: string;
  filters?: QueryFilters;
}

/**
 * Hybrid Forecast Service Class
 */
class HybridForecastService {
  private readonly cacheEnabled: boolean = true;

  constructor() {
    // Initialize service
    this.logMetric('service_started', 'system', { timestamp: new Date() });
  }

  /**
   * Get forecast summary with hybrid caching
   */
  async getForecastSummary(
    state?: string,
    userId?: string
  ): Promise<ForecastSummary[]> {
    const startTime = Date.now();
    const queryType = 'get_forecast_summary';
    const filters: QueryFilters = { state };

    const fingerprint = cacheUtils.generateFingerprint(queryType, filters);
    const useHotPath = cacheUtils.shouldUseHotPath(queryType, filters);

    try {
      // Try hot path first if recommended
      if (this.cacheEnabled && useHotPath) {
        const cachedResult = await this.getCachedSummary(fingerprint);

        if (cachedResult) {
          // Cache hit - update metrics and return
          await this.recordQueryMetrics({
            query_fingerprint: fingerprint,
            query_type: queryType,
            execution_time_ms: Date.now() - startTime,
            data_source: 'cache',
            cache_hit: true,
            error_occurred: false,
            user_id: userId,
            filters,
          });

          await this.incrementCacheHit('summary_cache', cachedResult.id);
          return cachedResult.data as ForecastSummary[];
        }
      }

      // Cache miss or cold path - query Athena
      const athenaResult = await forecastService.getForecastSummary(state);

      // Cache the result if using hot path
      if (this.cacheEnabled && useHotPath) {
        await this.cacheSummaryResult(queryType, filters, athenaResult);
      }

      // Record metrics
      await this.recordQueryMetrics({
        query_fingerprint: fingerprint,
        query_type: queryType,
        execution_time_ms: Date.now() - startTime,
        data_source: 'athena',
        cache_hit: false,
        error_occurred: false,
        user_id: userId,
        filters,
      });

      return athenaResult;

    } catch (error) {
      // Record error metrics
      await this.recordQueryMetrics({
        query_fingerprint: fingerprint,
        query_type: queryType,
        execution_time_ms: Date.now() - startTime,
        data_source: useHotPath ? 'cache' : 'athena',
        cache_hit: false,
        error_occurred: true,
        user_id: userId,
        filters,
      });

      throw error;
    }
  }

  /**
   * Get forecast by date with hybrid caching
   */
  async getForecastByDate(
    startDate: string,
    endDate?: string,
    state?: string,
    userId?: string
  ): Promise<ForecastByDate[]> {
    const startTime = Date.now();
    const queryType = 'get_forecast_by_date';
    const filters: QueryFilters = { startDate, endDate, state };

    const fingerprint = cacheUtils.generateFingerprint(queryType, filters);
    const useHotPath = cacheUtils.shouldUseHotPath(queryType, filters);

    try {
      // Try hot path first if recommended
      if (this.cacheEnabled && useHotPath) {
        const cachedResult = await this.getCachedTimeseries(fingerprint);

        if (cachedResult) {
          // Cache hit
          await this.recordQueryMetrics({
            query_fingerprint: fingerprint,
            query_type: queryType,
            execution_time_ms: Date.now() - startTime,
            data_source: 'cache',
            cache_hit: true,
            error_occurred: false,
            user_id: userId,
            filters,
          });

          await this.incrementCacheHit('timeseries_cache', cachedResult.id);
          return cachedResult.data as ForecastByDate[];
        }
      }

      // Cache miss or cold path - query Athena
      const athenaResult = await forecastService.getForecastByDate(startDate, endDate, state);

      // Cache the result if using hot path
      if (this.cacheEnabled && useHotPath) {
        await this.cacheTimeseriesResult(queryType, filters, athenaResult);
      }

      // Record metrics
      await this.recordQueryMetrics({
        query_fingerprint: fingerprint,
        query_type: queryType,
        execution_time_ms: Date.now() - startTime,
        data_source: 'athena',
        cache_hit: false,
        error_occurred: false,
        user_id: userId,
        filters,
      });

      return athenaResult;

    } catch (error) {
      await this.recordQueryMetrics({
        query_fingerprint: fingerprint,
        query_type: queryType,
        execution_time_ms: Date.now() - startTime,
        data_source: useHotPath ? 'cache' : 'athena',
        cache_hit: false,
        error_occurred: true,
        user_id: userId,
        filters,
      });

      throw error;
    }
  }

  /**
   * Execute custom query (always uses cold path)
   */
  async executeQuery(
    customQuery: string,
    userId?: string
  ): Promise<AthenaQueryResponse> {
    const startTime = Date.now();
    const queryType = 'execute_query';
    const fingerprint = cacheUtils.generateFingerprint(queryType, { });

    try {
      // Custom queries always bypass cache and go to Athena
      const result = await forecastService.executeQuery(customQuery);

      await this.recordQueryMetrics({
        query_fingerprint: fingerprint,
        query_type: queryType,
        execution_time_ms: Date.now() - startTime,
        data_source: 'athena',
        cache_hit: false,
        error_occurred: false,
        user_id: userId,
      });

      return result;

    } catch (error) {
      await this.recordQueryMetrics({
        query_fingerprint: fingerprint,
        query_type: queryType,
        execution_time_ms: Date.now() - startTime,
        data_source: 'athena',
        cache_hit: false,
        error_occurred: true,
        user_id: userId,
      });

      throw error;
    }
  }

  /**
   * Get raw forecast data with hybrid caching
   */
  async getForecastData(
    filters?: QueryFilters,
    userId?: string
  ): Promise<AthenaQueryResponse> {
    const startTime = Date.now();
    const queryType = 'get_forecast_data';
    const normalizedFilters = cacheUtils.normalize(filters || {});

    const fingerprint = cacheUtils.generateFingerprint(queryType, normalizedFilters);
    const useHotPath = cacheUtils.shouldUseHotPath(queryType, normalizedFilters);

    try {
      // For large queries, bypass cache
      if (!useHotPath) {
        const result = await forecastService.getForecastData(filters);

        await this.recordQueryMetrics({
          query_fingerprint: fingerprint,
          query_type: queryType,
          execution_time_ms: Date.now() - startTime,
          data_source: 'athena',
          cache_hit: false,
          error_occurred: false,
          user_id: userId,
          filters: normalizedFilters,
        });

        return result;
      }

      // Try cache first for hot path queries
      if (this.cacheEnabled) {
        const cachedResult = await this.getCachedData(fingerprint);

        if (cachedResult) {
          await this.recordQueryMetrics({
            query_fingerprint: fingerprint,
            query_type: queryType,
            execution_time_ms: Date.now() - startTime,
            data_source: 'cache',
            cache_hit: true,
            error_occurred: false,
            user_id: userId,
            filters: normalizedFilters,
          });

          return cachedResult.data as AthenaQueryResponse;
        }
      }

      // Cache miss - query Athena and cache result
      const athenaResult = await forecastService.getForecastData(filters);

      if (this.cacheEnabled && useHotPath) {
        await this.cacheDataResult(queryType, normalizedFilters, athenaResult);
      }

      await this.recordQueryMetrics({
        query_fingerprint: fingerprint,
        query_type: queryType,
        execution_time_ms: Date.now() - startTime,
        data_source: 'athena',
        cache_hit: false,
        error_occurred: false,
        user_id: userId,
        filters: normalizedFilters,
      });

      return athenaResult;

    } catch (error) {
      await this.recordQueryMetrics({
        query_fingerprint: fingerprint,
        query_type: queryType,
        execution_time_ms: Date.now() - startTime,
        data_source: useHotPath ? 'cache' : 'athena',
        cache_hit: false,
        error_occurred: true,
        user_id: userId,
        filters: normalizedFilters,
      });

      throw error;
    }
  }

  /**
   * Get cached summary data
   */
  private async getCachedSummary(fingerprint: string): Promise<CacheEntry<ForecastSummary[]> | null> {
    return await cacheService.getCachedSummary(fingerprint) as CacheEntry<ForecastSummary[]> | null;
  }

  /**
   * Get cached timeseries data
   */
  private async getCachedTimeseries(fingerprint: string): Promise<CacheEntry<ForecastByDate[]> | null> {
    return await cacheService.getCachedTimeseries(fingerprint) as CacheEntry<ForecastByDate[]> | null;
  }

  /**
   * Get cached general data
   */
  private async getCachedData(fingerprint: string): Promise<CacheEntry<AthenaQueryResponse> | null> {
    // Try summary cache first, then timeseries cache
    const summaryResult = await cacheService.getCachedSummary(fingerprint);
    if (summaryResult) {
      return summaryResult as unknown as CacheEntry<AthenaQueryResponse>;
    }

    const timeseriesResult = await cacheService.getCachedTimeseries(fingerprint);
    return timeseriesResult as unknown as CacheEntry<AthenaQueryResponse>;
  }

  /**
   * Cache summary result
   */
  private async cacheSummaryResult(
    queryType: string,
    filters: QueryFilters,
    data: ForecastSummary[]
  ): Promise<void> {
    await cacheService.cacheSummaryResult(queryType, filters, data);
  }

  /**
   * Cache timeseries result
   */
  private async cacheTimeseriesResult(
    queryType: string,
    filters: QueryFilters,
    data: ForecastByDate[]
  ): Promise<void> {
    await cacheService.cacheTimeseriesResult(queryType, filters, data);
  }

  /**
   * Cache general data result
   */
  private async cacheDataResult(
    queryType: string,
    filters: QueryFilters,
    data: AthenaQueryResponse
  ): Promise<void> {
    // For general data, determine appropriate cache table based on content
    if (queryType.includes('summary')) {
      await this.cacheSummaryResult(queryType, filters, data as unknown as ForecastSummary[]);
    } else {
      await this.cacheTimeseriesResult(queryType, filters, data as unknown as ForecastByDate[]);
    }
  }

  /**
   * Increment cache hit counter
   */
  private async incrementCacheHit(tableName: string, cacheId: number): Promise<void> {
    await cacheService.incrementCacheHit(tableName, cacheId);
  }

  /**
   * Record query metrics
   */
  private async recordQueryMetrics(metrics: QueryMetrics): Promise<void> {
    await cacheService.recordQueryMetrics(metrics);
  }

  /**
   * Log cache metadata
   */
  private async logMetric(metricName: string, category: string, value: unknown): Promise<void> {
    // For now, just log to console - can be enhanced later with API call
    console.log(`Cache metric [${category}] ${metricName}:`, value);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    hitRate: number;
    totalQueries: number;
    avgResponseTime: number;
    cacheSize: number;
  }> {
    return await cacheService.getCacheStats();
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    await cacheService.clearExpiredCache();
    console.log('Expired cache entries cleared');
  }
}

// Export singleton instance
export const hybridForecastService = new HybridForecastService();
export { HybridForecastService };
