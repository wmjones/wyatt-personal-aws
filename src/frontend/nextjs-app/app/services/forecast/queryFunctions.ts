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
  const requestBody = {
    action: 'get_forecast_summary',
    filters: {
      state: params.states?.[0], // API expects single state for summary
      startDate: params.startDate,
      endDate: params.endDate,
    }
  }

  const response = await fetch(`${API_BASE_URL}/data/postgres-forecast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch forecast summary: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data || result
}

/**
 * Fetch forecast time series data
 */
export async function fetchForecastTimeSeries(params: ForecastParams): Promise<ForecastTimeSeries[]> {
  // For time series, we need to fetch data and transform it
  interface ForecastFilters {
    startDate: string
    endDate: string
    state?: string | string[]
    dmaId?: string | string[]
    dcId?: number | number[]
    inventoryItemId?: number
  }

  const filters: ForecastFilters = {
    startDate: params.startDate,
    endDate: params.endDate,
  }

  // Add location filters if provided
  if (params.states && params.states.length > 0) {
    filters.state = params.states
  }
  if (params.dmaIds && params.dmaIds.length > 0) {
    filters.dmaId = params.dmaIds
  }
  if (params.dcIds && params.dcIds.length > 0) {
    filters.dcId = params.dcIds.map(id => parseInt(id))
  }

  // Handle inventory item IDs - API expects singular inventoryItemId
  if (params.itemIds && params.itemIds.length > 0) {
    // If multiple items, we'll need to make multiple requests
    // For now, just use the first one
    filters.inventoryItemId = parseInt(params.itemIds[0])
  }

  const requestBody = {
    action: 'get_forecast_data',
    filters
  }

  const response = await fetch(`${API_BASE_URL}/data/postgres-forecast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch forecast time series: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data || result
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
