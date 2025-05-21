'use client';

interface ForecastData {
  state: string;
  record_count: number;
  avg_forecast: number;
  min_forecast: number;
  max_forecast: number;
}

interface ForecastSummaryProps {
  data: ForecastData[];
  selectedState: string;
}

/**
 * Forecast Summary Component
 *
 * This component displays a summary of forecast data in a table format
 */
export default function ForecastSummary({ data, selectedState }: ForecastSummaryProps) {
  // Filter data based on selected state
  const filteredData = selectedState
    ? data.filter((item) => item.state === selectedState)
    : data;

  // Calculate total and averages
  const totalRecords = filteredData.reduce((sum, item) => sum + item.record_count, 0);
  const avgForecast = filteredData.length
    ? filteredData.reduce((sum, item) => sum + item.avg_forecast, 0) / filteredData.length
    : 0;
  const minForecast = filteredData.length
    ? Math.min(...filteredData.map((item) => item.min_forecast))
    : 0;
  const maxForecast = filteredData.length
    ? Math.max(...filteredData.map((item) => item.max_forecast))
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Forecast Summary
          {selectedState && ` - ${selectedState}`}
        </h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
          <p className="text-2xl font-semibold">{totalRecords.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Forecast</p>
          <p className="text-2xl font-semibold">{avgForecast.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Min Forecast</p>
          <p className="text-2xl font-semibold">{minForecast.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Max Forecast</p>
          <p className="text-2xl font-semibold">{maxForecast.toFixed(2)}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Records
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Avg Forecast
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Min Forecast
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Max Forecast
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((item) => (
              <tr key={item.state}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {item.state}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {item.record_count.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {item.avg_forecast.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {item.min_forecast.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {item.max_forecast.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
