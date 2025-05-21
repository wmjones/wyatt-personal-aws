/**
 * Athena API client for forecast data
 *
 * This module provides functions to interact with the Athena API
 * for querying and analyzing forecast data.
 */

// No need to import config as it's not used here
// import { config } from './config';

/**
 * Types for Athena API requests and responses
 */
export interface AthenaQueryRequest {
  action: 'execute_query' | 'get_forecast_summary' | 'get_forecast_by_date';
  query?: string;
  filters?: {
    state?: string;
    start_date?: string;
    end_date?: string;
  };
}

export interface AthenaQueryResponse {
  message: string;
  data: {
    columns: string[];
    rows: string[][];
  };
}

/**
 * Execute a custom Athena query
 */
export async function executeAthenaQuery(query: string): Promise<AthenaQueryResponse> {
  return athenaApiRequest({
    action: 'execute_query',
    query,
  });
}

/**
 * Get a summary of forecast data, optionally filtered by state
 */
export async function getForecastSummary(state?: string): Promise<AthenaQueryResponse> {
  return athenaApiRequest({
    action: 'get_forecast_summary',
    filters: state ? { state } : undefined,
  });
}

/**
 * Get forecast data for a date range
 */
export async function getForecastByDate(
  startDate: string,
  endDate?: string,
  state?: string
): Promise<AthenaQueryResponse> {
  return athenaApiRequest({
    action: 'get_forecast_by_date',
    filters: {
      start_date: startDate,
      end_date: endDate,
      state,
    },
  });
}

/**
 * Base function to send requests to the Athena API
 */
async function athenaApiRequest(request: AthenaQueryRequest): Promise<AthenaQueryResponse> {
  try {
    // Send the request to the API route
    const response = await fetch('/api/data/athena', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    // Handle errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error executing Athena query');
    }

    // Return the response data
    return await response.json();
  } catch (error) {
    console.error('Error in Athena API request:', error);
    throw error;
  }
}

/**
 * Transform Athena query results into a more usable format
 * for data visualization and display
 */
export function transformAthenaResults<T = Record<string, unknown>>(
  data: AthenaQueryResponse['data']
): T[] {
  const { columns, rows } = data;

  // Map each row to an object with column names as keys
  return rows.map((row) => {
    const rowObject = {} as T;
    columns.forEach((col, index) => {
      // Convert number strings to numbers, otherwise keep as string
      const value = row[index];
      const numValue = Number(value);

      (rowObject as Record<string, unknown>)[col] = !isNaN(numValue) && value !== '' ? numValue : value;
    });
    return rowObject;
  });
}
