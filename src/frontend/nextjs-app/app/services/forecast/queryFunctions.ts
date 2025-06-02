/**
 * Query functions for TanStack Query
 * These functions handle the actual data fetching
 */

import { ForecastData, ForecastSummary, ForecastTimeSeries } from '@/app/types/forecast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

interface ForecastParams {
  itemIds: string[]
  startDate: string
  endDate: string
  // Location filters
  states?: string[]
  dmaIds?: string[]
  dcIds?: string[]
}

/**
 * Fetch forecast summary data
 */
export async function fetchForecastSummary(params: ForecastParams): Promise<ForecastSummary[]> {
  const searchParams = new URLSearchParams({
    itemIds: params.itemIds.join(','),
    startDate: params.startDate,
    endDate: params.endDate,
  })

  // Add optional location filters
  if (params.states?.length) {
    searchParams.append('states', params.states.join(','))
  }
  if (params.dmaIds?.length) {
    searchParams.append('dmaIds', params.dmaIds.join(','))
  }
  if (params.dcIds?.length) {
    searchParams.append('dcIds', params.dcIds.join(','))
  }

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
    startDate: params.startDate,
    endDate: params.endDate,
  })

  // Add optional location filters
  if (params.states?.length) {
    searchParams.append('states', params.states.join(','))
  }
  if (params.dmaIds?.length) {
    searchParams.append('dmaIds', params.dmaIds.join(','))
  }
  if (params.dcIds?.length) {
    searchParams.append('dcIds', params.dcIds.join(','))
  }

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
