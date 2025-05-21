import { useState, useCallback } from 'react';
import {
  AthenaQueryResponse,
  executeAthenaQuery,
  getForecastSummary,
  getForecastByDate,
  transformAthenaResults
} from '@/app/lib/athena';

/**
 * Custom hook for interacting with Athena queries
 *
 * This hook provides an easy way to execute Athena queries
 * and manage loading and error states.
 */
export function useAthenaQuery<T = Record<string, unknown>>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T[]>([]);
  const [rawResponse, setRawResponse] = useState<AthenaQueryResponse | null>(null);

  /**
   * Execute a custom Athena query
   */
  const execQuery = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeAthenaQuery(query);
      setRawResponse(response);
      const transformedData = transformAthenaResults<T>(response.data);
      setData(transformedData);
      return transformedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a summary of forecast data, optionally filtered by state
   */
  const getForecastData = useCallback(async (state?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getForecastSummary(state);
      setRawResponse(response);
      const transformedData = transformAthenaResults<T>(response.data);
      setData(transformedData);
      return transformedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get forecast data for a date range
   */
  const getForecastByDateRange = useCallback(async (
    startDate: string,
    endDate?: string,
    state?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getForecastByDate(startDate, endDate, state);
      setRawResponse(response);
      const transformedData = transformAthenaResults<T>(response.data);
      setData(transformedData);
      return transformedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setRawResponse(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    rawResponse,
    execQuery,
    getForecastData,
    getForecastByDateRange,
    reset
  };
}
