'use client';

import { useState } from 'react';
import { useDatabaseQuery } from '../../hooks/useForecastData';
import ForecastChart from './ForecastChart';
import ForecastSummary from './ForecastSummary';

/**
 * Forecast Dashboard Component
 *
 * This component displays forecast data from Athena/S3 in various visualizations
 */
export default function ForecastDashboard() {
  // State for filtering
  const [selectedState, setSelectedState] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>('2024-12-31');

  // Query to get aggregated forecast data by date
  const aggregatedQuery = `
    SELECT
      business_date,
      SUM(y_05) as y_05,
      SUM(y_50) as y_50,
      SUM(y_95) as y_95
    FROM forecast_data
    WHERE business_date BETWEEN '${startDate}' AND '${endDate}'
    ${selectedState ? `AND state = '${selectedState}'` : ''}
    GROUP BY business_date
    ORDER BY business_date
  `;

  // Query to get summary statistics
  const summaryQuery = `
    SELECT
      state,
      COUNT(*) as record_count,
      AVG(y_50) as avg_forecast,
      MIN(y_05) as min_forecast,
      MAX(y_95) as max_forecast
    FROM forecast_data
    WHERE business_date BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY state
    ORDER BY state
  `;

  // Use Athena query hooks
  const {
    data: aggregatedData,
    loading: aggregatedLoading,
    error: aggregatedError,
    refetch: refetchAggregated
  } = useDatabaseQuery(aggregatedQuery);

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useDatabaseQuery(summaryQuery);

  // Transform aggregated data for the chart
  const chartData = aggregatedData ? aggregatedData.rows.map((row: string[]) => ({
    business_date: row[0],
    y_05: parseFloat(row[1]),
    y_50: parseFloat(row[2]),
    y_95: parseFloat(row[3])
  })) : [];

  // Transform summary data
  const summaryTableData = summaryData ? summaryData.rows.map((row: string[]) => ({
    state: row[0],
    record_count: parseInt(row[1], 10),
    avg_forecast: parseFloat(row[2]),
    min_forecast: parseFloat(row[3]),
    max_forecast: parseFloat(row[4])
  })) : [];

  // Handle refresh
  const handleRefresh = () => {
    refetchAggregated();
    refetchSummary();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Forecast Dashboard</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All States</option>
              {summaryTableData.map((item) => (
                <option key={item.state} value={item.state}>
                  {item.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRefresh}
              disabled={aggregatedLoading || summaryLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {aggregatedLoading || summaryLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Loading/Error States */}
        {(aggregatedLoading || summaryLoading) && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {(aggregatedError || summaryError) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">
              {aggregatedError?.message || summaryError?.message || 'An error occurred loading forecast data'}
            </p>
          </div>
        )}

        {/* Data Visualizations */}
        {!aggregatedLoading && !aggregatedError && chartData.length > 0 && (
          <ForecastChart data={chartData} />
        )}

        {!summaryLoading && !summaryError && summaryTableData.length > 0 && (
          <ForecastSummary data={summaryTableData} selectedState={selectedState} />
        )}
      </div>
    </div>
  );
}
