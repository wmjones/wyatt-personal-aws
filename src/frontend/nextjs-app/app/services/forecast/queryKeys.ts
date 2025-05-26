/**
 * Query key factory for forecast-related queries
 * Ensures consistent key generation across the application
 */

export const forecastKeys = {
  all: ['forecast'] as const,

  // Summary data queries
  summary: (params: {
    itemIds: string[]
    locationIds: string[]
    startDate: string
    endDate: string
  }) => [...forecastKeys.all, 'summary', params] as const,

  // Time series data queries
  timeSeries: (params: {
    itemIds: string[]
    locationIds: string[]
    startDate: string
    endDate: string
  }) => [...forecastKeys.all, 'timeSeries', params] as const,

  // Combined forecast data (summary + timeSeries)
  combined: (params: {
    itemIds: string[]
    locationIds: string[]
    startDate: string
    endDate: string
  }) => [...forecastKeys.all, 'combined', params] as const,
}
