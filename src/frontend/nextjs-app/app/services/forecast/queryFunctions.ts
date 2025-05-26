/**
 * Query functions for TanStack Query
 * These functions handle the actual data fetching
 */

import { ForecastData, ForecastSummary, ForecastTimeSeries } from '@/app/types/forecast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

interface ForecastParams {
  itemIds: string[]
  locationIds: string[]
  startDate: string
  endDate: string
}

/**
 * Fetch forecast summary data
 */
export async function fetchForecastSummary(params: ForecastParams): Promise<ForecastSummary[]> {
  const searchParams = new URLSearchParams({
    itemIds: params.itemIds.join(','),
    locationIds: params.locationIds.join(','),
    startDate: params.startDate,
    endDate: params.endDate,
  })

  const response = await fetch(`${API_BASE_URL}/data/postgres-forecast?${searchParams}&type=summary`)

  if (!response.ok) {
    throw new Error(`Failed to fetch forecast summary: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch forecast time series data
 */
export async function fetchForecastTimeSeries(params: ForecastParams): Promise<ForecastTimeSeries[]> {
  const searchParams = new URLSearchParams({
    itemIds: params.itemIds.join(','),
    locationIds: params.locationIds.join(','),
    startDate: params.startDate,
    endDate: params.endDate,
  })

  const response = await fetch(`${API_BASE_URL}/data/postgres-forecast?${searchParams}&type=timeseries`)

  if (!response.ok) {
    throw new Error(`Failed to fetch forecast time series: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch combined forecast data (summary + time series)
 */
export async function fetchCombinedForecast(params: ForecastParams): Promise<ForecastData> {
  // Use Promise.all to fetch both in parallel
  const [summary, timeSeries] = await Promise.all([
    fetchForecastSummary(params),
    fetchForecastTimeSeries(params),
  ])

  return {
    summary,
    timeSeries,
  }
}
