/**
 * Query key factory for forecast-related queries
 * Ensures consistent key generation across the application
 */

export const forecastKeys = {
  all: ['forecast'] as const,

  // Summary data queries
  summary: (params: {
    itemIds: string[]
    startDate: string
    endDate: string
    states?: string[]
    dmaIds?: string[]
    dcIds?: string[]
  }) => [...forecastKeys.all, 'summary', params] as const,

  // Time series data queries
  timeSeries: (params: {
    itemIds: string[]
    startDate: string
    endDate: string
    states?: string[]
    dmaIds?: string[]
    dcIds?: string[]
  }) => [...forecastKeys.all, 'timeSeries', params] as const,

  // Combined forecast data (summary + timeSeries)
  combined: (params: {
    itemIds: string[]
    startDate: string
    endDate: string
    states?: string[]
    dmaIds?: string[]
    dcIds?: string[]
  }) => [...forecastKeys.all, 'combined', params] as const,
}
