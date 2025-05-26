/**
 * TanStack Query hooks for forecast data
 * Provides automatic deduplication, caching, and state management
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { forecastKeys } from '@/app/services/forecast/queryKeys'
import {
  fetchForecastSummary,
  fetchForecastTimeSeries,
  fetchCombinedForecast
} from '@/app/services/forecast/queryFunctions'
import { ForecastData, ForecastSummary, ForecastTimeSeries } from '@/app/types/forecast'

interface ForecastQueryParams {
  itemIds: string[]
  locationIds: string[]
  startDate: string
  endDate: string
}

/**
 * Hook to fetch forecast summary data
 */
export function useForecastSummary(
  params: ForecastQueryParams,
  options?: Omit<UseQueryOptions<ForecastSummary[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: forecastKeys.summary(params),
    queryFn: () => fetchForecastSummary(params),
    enabled: params.itemIds.length > 0 && params.locationIds.length > 0,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    ...options,
  })
}

/**
 * Hook to fetch forecast time series data
 */
export function useForecastTimeSeries(
  params: ForecastQueryParams,
  options?: Omit<UseQueryOptions<ForecastTimeSeries[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: forecastKeys.timeSeries(params),
    queryFn: () => fetchForecastTimeSeries(params),
    enabled: params.itemIds.length > 0 && params.locationIds.length > 0,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    ...options,
  })
}

/**
 * Hook to fetch combined forecast data (summary + time series)
 * This is the main hook to use for the forecast dashboard
 */
export function useForecastData(
  params: ForecastQueryParams,
  options?: Omit<UseQueryOptions<ForecastData, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: forecastKeys.combined(params),
    queryFn: () => fetchCombinedForecast(params),
    enabled: params.itemIds.length > 0 && params.locationIds.length > 0,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    ...options,
  })
}
