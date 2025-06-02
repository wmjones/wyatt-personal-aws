/**
 * Cache utilities for forecast data caching system
 *
 * This module provides utilities for query fingerprinting,
 * cache key generation, and TTL management.
 */

// Client/server compatible hashing utilities

/**
 * Query filter interface for standardization
 */
export interface QueryFilters {
  state?: string | string[];
  startDate?: string;
  endDate?: string;
  restaurantId?: number;
  inventoryItemId?: number;
  limit?: number;
}

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // TTL values in seconds
  TTL: {
    SUMMARY: 60 * 60, // 1 hour for summary data
    TIMESERIES: 30 * 60, // 30 minutes for time series
    DETAILED: 15 * 60, // 15 minutes for detailed queries
  },

  // Cache key prefixes
  PREFIXES: {
    SUMMARY: 'forecast:summary',
    TIMESERIES: 'forecast:timeseries',
    DETAILED: 'forecast:detailed',
  },

  // Query patterns that should always use cache
  HOT_PATTERNS: [
    'state_summary',
    'recent_dates',
    'popular_states',
  ],

  // Query patterns that should bypass cache
  COLD_PATTERNS: [
    'custom_query',
    'large_date_range',
    'complex_aggregation',
  ],
} as const;

/**
 * Generate a consistent fingerprint for a query
 */
export function generateQueryFingerprint(
  queryType: string,
  filters: QueryFilters = {}
): string {
  // Normalize filters for consistent hashing
  const normalizedFilters = {
    state: Array.isArray(filters.state)
      ? filters.state.map(s => s.toLowerCase()).sort()
      : filters.state?.toLowerCase(),
    startDate: filters.startDate,
    endDate: filters.endDate,
    restaurantId: filters.restaurantId,
    inventoryItemId: filters.inventoryItemId,
    limit: filters.limit,
  };

  // Sort keys for consistent ordering
  const sortedFilters = Object.fromEntries(
    Object.entries(normalizedFilters)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
  );

  // Create hash input
  const hashInput = JSON.stringify({
    queryType,
    filters: sortedFilters,
  });

  // Generate SHA-256 hash using Node.js crypto (server-side only)
  if (typeof window === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  // For client-side, use a simple hash (or could implement Web Crypto)
  // This is acceptable since fingerprinting happens primarily on server
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate cache key from query fingerprint
 */
export function generateCacheKey(
  queryType: string,
  filters: QueryFilters = {}
): string {
  const fingerprint = generateQueryFingerprint(queryType, filters);

  // Determine prefix based on query type
  let prefix: string = CACHE_CONFIG.PREFIXES.DETAILED;

  if (queryType === 'get_forecast_summary') {
    prefix = CACHE_CONFIG.PREFIXES.SUMMARY;
  } else if (queryType === 'get_forecast_by_date') {
    prefix = CACHE_CONFIG.PREFIXES.TIMESERIES;
  }

  return `${prefix}:${fingerprint}`;
}

/**
 * Determine TTL based on query characteristics
 */
export function determineTTL(
  queryType: string,
  filters: QueryFilters = {}
): number {
  // Base TTL on query type
  let baseTTL = CACHE_CONFIG.TTL.DETAILED;

  if (queryType === 'get_forecast_summary') {
    baseTTL = CACHE_CONFIG.TTL.SUMMARY;
  } else if (queryType === 'get_forecast_by_date') {
    baseTTL = CACHE_CONFIG.TTL.TIMESERIES;
  }

  // Adjust TTL based on query characteristics
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const daysDiff = Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Longer date ranges get shorter TTL (more likely to be complex queries)
    if (daysDiff > 30) {
      baseTTL = Math.floor(baseTTL * 0.5);
    } else if (daysDiff > 7) {
      baseTTL = Math.floor(baseTTL * 0.75);
    }
  }

  // Queries with limits typically fetch recent data, cache longer
  if (filters.limit && filters.limit <= 100) {
    baseTTL = Math.floor(baseTTL * 1.5);
  }

  return baseTTL;
}

/**
 * Determine if a query should use hot path (cache first)
 */
export function shouldUseHotPath(
  queryType: string,
  filters: QueryFilters = {}
): boolean {
  // Always use hot path for summary queries
  if (queryType === 'get_forecast_summary') {
    return true;
  }

  // Use hot path for recent date queries
  if (queryType === 'get_forecast_by_date' && filters.startDate) {
    const queryDate = new Date(filters.startDate);
    const now = new Date();
    const daysDiff = Math.abs((now.getTime() - queryDate.getTime()) / (1000 * 60 * 60 * 24));

    // Cache queries for data within last 30 days
    if (daysDiff <= 30) {
      return true;
    }
  }

  // Use hot path for popular states
  const popularStates = ['CA', 'TX', 'FL', 'NY', 'IL'];
  if (filters.state) {
    const states = Array.isArray(filters.state) ? filters.state : [filters.state];
    if (states.some(state => popularStates.includes(state.toUpperCase()))) {
      return true;
    }
  }

  // Use hot path for small result sets
  if (filters.limit && filters.limit <= 50) {
    return true;
  }

  // Use cold path for custom queries and large data requests
  if (queryType === 'execute_query') {
    return false;
  }

  // Default to hot path for standard queries
  return true;
}

/**
 * Calculate cache expiration timestamp
 */
export function calculateExpiresAt(ttlSeconds: number): Date {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);
  return expiresAt;
}

/**
 * Check if cache entry is expired
 */
export function isCacheExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Normalize query filters for consistent caching
 */
export function normalizeFilters(filters: QueryFilters): QueryFilters {
  return {
    state: Array.isArray(filters.state)
      ? filters.state.map(s => s.toUpperCase())
      : filters.state?.toUpperCase(),
    startDate: filters.startDate,
    endDate: filters.endDate,
    restaurantId: filters.restaurantId,
    inventoryItemId: filters.inventoryItemId,
    limit: filters.limit,
  };
}

/**
 * Generate cache statistics key
 */
export function generateStatsKey(metric: string, category: string): string {
  return `${category}:${metric}`;
}

/**
 * Cache utility functions
 */
export const cacheUtils = {
  generateFingerprint: generateQueryFingerprint,
  generateKey: generateCacheKey,
  determineTTL: determineTTL,
  shouldUseHotPath: shouldUseHotPath,
  calculateExpires: calculateExpiresAt,
  isExpired: isCacheExpired,
  normalize: normalizeFilters,
  statsKey: generateStatsKey,
};
