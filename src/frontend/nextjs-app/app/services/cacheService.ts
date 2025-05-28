/**
 * Client-Safe Cache Service
 *
 * This service provides client-side access to cache operations
 * through API routes, avoiding direct database imports.
 */

import { apiClient } from './api/client';
import { QueryFilters } from '../lib/cache-utils';

/**
 * Cache entry interface (client-side version)
 */
interface CacheEntry<T = unknown> {
  id: number;
  cache_key: string;
  query_fingerprint: string;
  data: T;
  created_at: string;
  updated_at: string;
  expires_at: string;
  hit_count: number;
}

/**
 * Cache statistics interface
 */
interface CacheStats {
  hitRate: number;
  totalQueries: number;
  avgResponseTime: number;
  cacheSize: number;
}

/**
 * Query metrics interface
 */
interface QueryMetrics {
  query_fingerprint: string;
  query_type: string;
  execution_time_ms: number;
  data_source: 'cache' | 'athena' | 'database';
  cache_hit: boolean;
  error_occurred: boolean;
  user_id?: string;
  filters?: QueryFilters;
}

class CacheService {
  private readonly baseUrl = '/api/forecast/cache';

  /**
   * Get cached summary data
   */
  async getCachedSummary(fingerprint: string): Promise<CacheEntry | null> {
    try {
      const response = await apiClient.get<{ data: CacheEntry | null }>(
        `${this.baseUrl}?action=get_summary&fingerprint=${encodeURIComponent(fingerprint)}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting cached summary:', error);
      return null;
    }
  }

  /**
   * Get cached timeseries data
   */
  async getCachedTimeseries(fingerprint: string): Promise<CacheEntry | null> {
    try {
      const response = await apiClient.get<{ data: CacheEntry | null }>(
        `${this.baseUrl}?action=get_timeseries&fingerprint=${encodeURIComponent(fingerprint)}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting cached timeseries:', error);
      return null;
    }
  }

  /**
   * Cache summary result
   */
  async cacheSummaryResult(
    queryType: string,
    filters: QueryFilters,
    data: unknown
  ): Promise<void> {
    try {
      await apiClient.post(this.baseUrl, {
        action: 'cache_summary',
        data: {
          queryType,
          filters,
          summaryData: data
        }
      });
    } catch (error) {
      console.error('Error caching summary result:', error);
    }
  }

  /**
   * Cache timeseries result
   */
  async cacheTimeseriesResult(
    queryType: string,
    filters: QueryFilters,
    data: unknown
  ): Promise<void> {
    try {
      await apiClient.post(this.baseUrl, {
        action: 'cache_timeseries',
        data: {
          queryType,
          filters,
          timeseriesData: data
        }
      });
    } catch (error) {
      console.error('Error caching timeseries result:', error);
    }
  }

  /**
   * Record query metrics
   */
  async recordQueryMetrics(metrics: QueryMetrics): Promise<void> {
    try {
      await apiClient.post(this.baseUrl, {
        action: 'record_metrics',
        data: { metrics }
      });
    } catch (error) {
      console.error('Error recording query metrics:', error);
    }
  }

  /**
   * Increment cache hit counter
   */
  async incrementCacheHit(tableName: string, cacheId: number): Promise<void> {
    try {
      await apiClient.post(this.baseUrl, {
        action: 'increment_hit',
        data: { tableName, cacheId }
      });
    } catch (error) {
      console.error('Error incrementing cache hit:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const response = await apiClient.get<{ data: CacheStats }>(
        `${this.baseUrl}?action=get_stats`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        hitRate: 0,
        totalQueries: 0,
        avgResponseTime: 0,
        cacheSize: 0,
      };
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    try {
      await apiClient.post(this.baseUrl, {
        action: 'clear_expired',
        data: {}
      });
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export { CacheService };
// Test comment
