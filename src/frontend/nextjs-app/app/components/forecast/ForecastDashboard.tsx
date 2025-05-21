'use client';

import { useState, useEffect } from 'react';
import { useAthenaQuery } from '@/app/hooks/useAthenaQuery';
import ForecastChart from './ForecastChart';
import ForecastSummary from './ForecastSummary';

interface ForecastData {
  state: string;
  record_count: number;
  avg_forecast: number;
  min_forecast: number;
  max_forecast: number;
}

interface DateForecast {
  business_date: string;
  avg_forecast: number;
}

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

  // Use Athena query hooks
  const summaryQuery = useAthenaQuery<ForecastData>();
  const dateQuery = useAthenaQuery<DateForecast>();

  // Load forecast summary on component mount
  useEffect(() => {
    summaryQuery.getForecastData();
  }, [summaryQuery]);

  // Load date-based forecast when filter changes
  useEffect(() => {
    if (startDate) {
      dateQuery.getForecastByDateRange(startDate, endDate, selectedState);
    }
  }, [selectedState, startDate, endDate, dateQuery]);

  // Handle state selection
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
  };

  // Handle date range changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Forecast Dashboard</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              State
            </label>
            <select
              value={selectedState}
              onChange={handleStateChange}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All States</option>
              {summaryQuery.data.map((item) => (
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
              onChange={handleStartDateChange}
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
              onChange={handleEndDateChange}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Loading/Error States */}
        {(summaryQuery.loading || dateQuery.loading) && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {(summaryQuery.error || dateQuery.error) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">
              {summaryQuery.error?.message || dateQuery.error?.message || 'An error occurred loading forecast data'}
            </p>
          </div>
        )}

        {/* Data Visualizations */}
        {!summaryQuery.loading && !summaryQuery.error && summaryQuery.data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ForecastSummary data={summaryQuery.data} selectedState={selectedState} />

            {!dateQuery.loading && !dateQuery.error && dateQuery.data.length > 0 && (
              <ForecastChart data={dateQuery.data} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
