import { useState, useEffect, useCallback } from 'react';
import { hybridForecastService } from '../services/hybridForecastService';
import { ForecastSummary, ForecastByDate } from '../types/forecast';

interface UseForecastDataOptions {
  autoFetch?: boolean;
}

interface ForecastDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch forecast summary data
 */
export function useForecastSummary(
  state?: string,
  options: UseForecastDataOptions = {}
): ForecastDataState<ForecastSummary[]> {
  const [data, setData] = useState<ForecastSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await hybridForecastService.getForecastSummary(state);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch forecast summary'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, options.autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Hook to fetch forecast data by date range
 */
export function useForecastByDate(
  startDate: string,
  endDate?: string,
  state?: string,
  options: UseForecastDataOptions = {}
): ForecastDataState<ForecastByDate[]> {
  const [data, setData] = useState<ForecastByDate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!startDate) {
      setError(new Error('Start date is required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await hybridForecastService.getForecastByDate(startDate, endDate, state);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch forecast data'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, state]);

  useEffect(() => {
    if (options.autoFetch !== false && startDate) {
      fetchData();
    }
  }, [fetchData, options.autoFetch, startDate]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Hook to fetch raw forecast data with filters
 */
export function useForecastData(
  filters?: {
    restaurantId?: number;
    inventoryItemId?: number;
    state?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  },
  options: UseForecastDataOptions = {}
): ForecastDataState<{ columns: string[]; rows: string[][] }> {
  const [data, setData] = useState<{ columns: string[]; rows: string[][] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await hybridForecastService.getForecastData(filters);
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch forecast data'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, options.autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Hook to execute custom database queries
 */
export function useDatabaseQuery(
  query?: string,
  options: UseForecastDataOptions = {}
): ForecastDataState<{ columns: string[]; rows: string[][] }> & {
  execute: (customQuery: string) => Promise<void>;
} {
  const [data, setData] = useState<{ columns: string[]; rows: string[][] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (customQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await hybridForecastService.executeQuery(customQuery);
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to execute query'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.autoFetch !== false && query) {
      execute(query);
    }
  }, [execute, options.autoFetch, query]);

  return {
    data,
    loading,
    error,
    refetch: () => query ? execute(query) : Promise.resolve(),
    execute
  };
}
