'use client';

import { useState, useEffect } from 'react';
import { forecastCache } from '@/app/lib/forecast-cache';

export default function CacheStatus() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<{
    size: number;
    entries: Array<{ key: string; age: number; size: number }>;
  } | null>(null);

  const refreshStats = () => {
    setStats(forecastCache.getStats());
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
    }
  }, [isOpen]);

  const formatAge = (ageMs: number) => {
    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)}KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)}MB`;
  };

  const clearCache = () => {
    if (confirm('Are you sure you want to clear the cache?')) {
      forecastCache.clear();
      refreshStats();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-dp-text-tertiary hover:text-dp-text-secondary transition-colors"
        title="Cache Status"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-6 w-80 bg-white dark:bg-gray-800 border border-dp-border-light rounded-lg shadow-lg p-4 z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-dp-text-primary">Cache Status</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-dp-text-tertiary hover:text-dp-text-primary"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {stats && (
            <>
              <div className="mb-3">
                <p className="text-xs text-dp-text-secondary">
                  Cached Views: <span className="font-semibold">{stats.size}</span> / 10
                </p>
              </div>

              {stats.entries.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stats.entries.map((entry, idx) => (
                    <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <div className="flex justify-between text-dp-text-secondary">
                        <span>Age: {formatAge(entry.age)}</span>
                        <span>Size: {formatSize(entry.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-dp-text-tertiary">No cached data</p>
              )}

              <div className="mt-3 flex justify-between">
                <button
                  onClick={refreshStats}
                  className="text-xs text-dp-text-secondary hover:text-dp-text-primary"
                >
                  Refresh
                </button>
                <button
                  onClick={clearCache}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear Cache
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
