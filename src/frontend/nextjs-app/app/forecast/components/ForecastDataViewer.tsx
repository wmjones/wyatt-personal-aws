'use client';

import React, { useState } from 'react';
import { useForecastSummary, useForecastByDate } from '../../hooks/useForecastData';

export function ForecastDataViewer() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-12-31'
  });

  // Fetch forecast summary
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useForecastSummary(selectedState);

  // Fetch forecast by date
  const {
    data: dateData,
    loading: dateLoading,
    error: dateError,
    refetch: refetchDate
  } = useForecastByDate(
    dateRange.start,
    dateRange.end,
    selectedState
  );

  const states = ['CA', 'TX', 'FL', 'NY', 'PA']; // Example states

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Forecast Data Viewer</h1>

      {/* Controls */}
      <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
        <div>
          <label className="block text-sm font-medium mb-2">
            Filter by State
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              refetchSummary();
              refetchDate();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={summaryLoading || dateLoading}
          >
            {summaryLoading || dateLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {(summaryError || dateError) && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p className="font-medium">Error:</p>
          <p>{summaryError?.message || dateError?.message}</p>
        </div>
      )}

      {/* Summary Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Summary Statistics</h2>
        {summaryLoading ? (
          <p>Loading summary...</p>
        ) : summaryData && summaryData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left">State</th>
                  <th className="border px-4 py-2 text-right">Records</th>
                  <th className="border px-4 py-2 text-right">Avg Forecast</th>
                  <th className="border px-4 py-2 text-right">Min (5th %ile)</th>
                  <th className="border px-4 py-2 text-right">Max (95th %ile)</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{row.state}</td>
                    <td className="border px-4 py-2 text-right">
                      {row.recordCount.toLocaleString()}
                    </td>
                    <td className="border px-4 py-2 text-right">
                      {row.avgForecast.toFixed(2)}
                    </td>
                    <td className="border px-4 py-2 text-right">
                      {row.minForecast.toFixed(2)}
                    </td>
                    <td className="border px-4 py-2 text-right">
                      {row.maxForecast.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No summary data available</p>
        )}
      </div>

      {/* Date-based Forecast Chart */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Forecast Trend by Date</h2>
        {dateLoading ? (
          <p>Loading forecast data...</p>
        ) : dateData && dateData.length > 0 ? (
          <div className="bg-white p-4 border rounded-lg">
            <div className="h-64 flex items-end justify-between gap-1">
              {dateData.slice(0, 30).map((item, idx) => {
                const maxValue = Math.max(...dateData.map((d) => d.avgForecast));
                const height = (item.avgForecast / maxValue) * 100;

                return (
                  <div
                    key={idx}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 transition-colors"
                    style={{ height: `${height}%` }}
                    title={`${item.businessDate}: ${item.avgForecast.toFixed(2)}`}
                  />
                );
              })}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Showing up to 30 most recent data points
            </p>
          </div>
        ) : (
          <p className="text-gray-500">No date-based forecast data available</p>
        )}
      </div>
    </div>
  );
}
