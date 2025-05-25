/**
 * Client-side cache for forecast data using localStorage
 * Implements a simple cache with TTL (time-to-live) for forecast views
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Max number of entries
}

export class ForecastCache {
  private static instance: ForecastCache;
  private readonly CACHE_KEY_PREFIX = 'forecast_cache_';
  private readonly INDEX_KEY = 'forecast_cache_index';

  // Default configuration
  private config: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 10 // Store up to 10 different views
  };

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): ForecastCache {
    if (!ForecastCache.instance) {
      ForecastCache.instance = new ForecastCache();
    }
    return ForecastCache.instance;
  }

  /**
   * Generate a cache key from query parameters
   */
  generateKey(params: {
    states?: string[];
    dmaIds?: string[];
    dcIds?: string[];
    startDate?: string;
    endDate?: string;
  }): string {
    // Sort arrays to ensure consistent keys
    const sortedParams = {
      states: params.states?.sort() || [],
      dmaIds: params.dmaIds?.sort() || [],
      dcIds: params.dcIds?.sort() || [],
      startDate: params.startDate || '',
      endDate: params.endDate || ''
    };

    return btoa(JSON.stringify(sortedParams));
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_KEY_PREFIX}${key}`);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if expired
      if (Date.now() - entry.timestamp > this.config.ttl) {
        this.remove(key);
        return null;
      }

      console.log('Cache hit for key:', key);
      return entry.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T): void {
    try {
      // Get current index
      const index = this.getIndex();

      // Check size limit
      if (!index.includes(key) && index.length >= this.config.maxSize) {
        // Remove oldest entry
        const oldestKey = index[0];
        this.remove(oldestKey);
      }

      // Store new entry
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        key
      };

      localStorage.setItem(`${this.CACHE_KEY_PREFIX}${key}`, JSON.stringify(entry));

      // Update index
      if (!index.includes(key)) {
        index.push(key);
        this.setIndex(index);
      }

      console.log('Cache set for key:', key);
    } catch (error) {
      console.error('Error writing to cache:', error);
      // If localStorage is full, clear old entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clear();
      }
    }
  }

  /**
   * Remove a specific cache entry
   */
  remove(key: string): void {
    localStorage.removeItem(`${this.CACHE_KEY_PREFIX}${key}`);

    // Update index
    const index = this.getIndex();
    const newIndex = index.filter(k => k !== key);
    this.setIndex(newIndex);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const index = this.getIndex();
    index.forEach(key => {
      localStorage.removeItem(`${this.CACHE_KEY_PREFIX}${key}`);
    });
    this.setIndex([]);
    console.log('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: Array<{ key: string; age: number; size: number }>;
  } {
    const index = this.getIndex();
    const entries = index.map(key => {
      const item = localStorage.getItem(`${this.CACHE_KEY_PREFIX}${key}`);
      if (!item) return null;

      const entry = JSON.parse(item);
      return {
        key,
        age: Date.now() - entry.timestamp,
        size: item.length
      };
    }).filter(Boolean) as Array<{ key: string; age: number; size: number }>;

    return {
      size: entries.length,
      entries
    };
  }

  /**
   * Preload common views
   */
  async preloadCommonViews<T>(
    loader: (params: {
      states?: string[];
      dmaIds?: string[];
      dcIds?: string[];
      startDate?: string;
      endDate?: string;
    }) => Promise<T>,
    commonViews: Array<{
      states?: string[];
      dmaIds?: string[];
      dcIds?: string[];
      startDate?: string;
      endDate?: string;
    }>
  ): Promise<void> {
    console.log('Preloading common views...');

    for (const view of commonViews) {
      const key = this.generateKey(view);
      const cached = this.get(key);

      if (!cached) {
        try {
          const data = await loader(view);
          this.set(key, data);
        } catch (error) {
          console.error('Error preloading view:', error);
        }
      }
    }
  }

  private getIndex(): string[] {
    try {
      const index = localStorage.getItem(this.INDEX_KEY);
      return index ? JSON.parse(index) : [];
    } catch {
      return [];
    }
  }

  private setIndex(index: string[]): void {
    localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
  }
}

// Export singleton instance
export const forecastCache = ForecastCache.getInstance();
