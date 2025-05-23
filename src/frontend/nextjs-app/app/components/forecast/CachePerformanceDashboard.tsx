/**
 * Cache Performance Dashboard Component
 *
 * This component displays real-time performance metrics for the
 * hybrid forecast data caching system.
 */

'use client';

import { useState, useEffect } from 'react';
import { hybridForecastService } from '../../services/hybridForecastService';

interface CacheStats {
  hitRate: number;
  totalQueries: number;
  avgResponseTime: number;
  cacheSize: number;
}

interface PerformanceMetric {
  label: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'error';
}

export default function CachePerformanceDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheStats = await hybridForecastService.getCacheStats();
      setStats(cacheStats);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const getMetrics = (): PerformanceMetric[] => {
    if (!stats) return [];

    return [
      {
        label: 'Cache Hit Rate',
        value: stats.hitRate,
        unit: '%',
        status: stats.hitRate >= 70 ? 'good' : stats.hitRate >= 50 ? 'warning' : 'error'
      },
      {
        label: 'Total Queries (24h)',
        value: stats.totalQueries.toLocaleString(),
        status: 'good'
      },
      {
        label: 'Avg Response Time',
        value: stats.avgResponseTime,
        unit: 'ms',
        status: stats.avgResponseTime <= 500 ? 'good' : stats.avgResponseTime <= 1000 ? 'warning' : 'error'
      },
      {
        label: 'Cache Entries',
        value: stats.cacheSize.toLocaleString(),
        status: 'good'
      }
    ];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const clearExpiredCache = async () => {
    try {
      await hybridForecastService.clearExpiredCache();
      await fetchStats(); // Refresh stats after clearing
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  };

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Cache Performance Metrics
          </h3>
          <p className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={clearExpiredCache}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            Clear Expired
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getMetrics().map((metric, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold">
                  {metric.value}
                  {metric.unit && (
                    <span className="text-sm font-normal ml-1">
                      {metric.unit}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  metric.status === 'good' ? 'bg-green-500' :
                  metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Cost Savings:</span> ~
              {Math.round(stats.hitRate * 0.7)}% reduction in Athena queries
            </div>
            <div>
              <span className="font-medium">Performance:</span> {
                stats.avgResponseTime <= 500 ? 'Excellent' :
                stats.avgResponseTime <= 1000 ? 'Good' : 'Needs Optimization'
              }
            </div>
            <div>
              <span className="font-medium">Cache Efficiency:</span> {
                stats.hitRate >= 70 ? 'High' :
                stats.hitRate >= 50 ? 'Moderate' : 'Low'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
