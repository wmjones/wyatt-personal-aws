'use client';

import { useState } from 'react';
import { ForecastSeries } from '@/app/types/demand-planning';
import TimeSeriesChart from './charts/TimeSeriesChart';
// ComparisonChart is imported but not used yet
// import ComparisonChart from './charts/ComparisonChart';
import ResponsiveChartWrapper from './charts/ResponsiveChartWrapper';

interface ForecastChartsProps {
  forecastData: ForecastSeries;
  className?: string;
  onRevertEdits?: () => void;
}

export default function ForecastCharts({
  forecastData,
  className = '',
  onRevertEdits
}: ForecastChartsProps) {
  // Time period selection state based on reference image
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'threeWeeks'>('week');
  const selectedDateRange = 'May 19 - May 24, 2025'; // Currently static, will be dynamic in the future

  // Toggle state for data series based on reference image
  const [toggles, setToggles] = useState({
    forecasted: true,
    edited: true,
    actual: true,
    actual2024: true,
    actual2023: false
  });

  const hasAdjustedData = !!forecastData.adjusted && forecastData.adjusted.length > 0;

  // Toggle data series display
  const handleToggle = (series: keyof typeof toggles) => {
    setToggles(prev => ({
      ...prev,
      [series]: !prev[series]
    }));
  };

  // Handle date navigation
  const handlePrevDate = () => {
    // This would normally adjust the date range
    console.log("Navigate to previous week");
  };

  const handleNextDate = () => {
    // This would normally adjust the date range
    console.log("Navigate to next week");
  };

  return (
    <div className={`bg-dp-surface-primary border border-dp-border-light rounded-lg shadow-dp-medium ${className}`}>
      {/* Top bar with time period selection and revert button */}
      <div className="p-4 border-b border-dp-border-light">
        <div className="flex justify-between items-center">
          {/* Time period selector - Day/Week/Three Weeks exactly matching reference */}
          <div className="flex items-center space-x-1 bg-dp-background-tertiary rounded-lg p-1">
            <button
              className={`px-5 py-2 text-sm rounded-md transition-colors ${
                selectedTimeRange === 'day'
                  ? 'bg-white shadow-sm text-dp-text-primary'
                  : 'text-dp-text-secondary hover:text-dp-text-primary'
              }`}
              onClick={() => setSelectedTimeRange('day')}
            >
              Day
            </button>
            <button
              className={`px-5 py-2 text-sm rounded-md transition-colors ${
                selectedTimeRange === 'week'
                  ? 'bg-white shadow-sm text-dp-text-primary'
                  : 'text-dp-text-secondary hover:text-dp-text-primary'
              }`}
              onClick={() => setSelectedTimeRange('week')}
            >
              Week
            </button>
            <button
              className={`px-5 py-2 text-sm rounded-md transition-colors ${
                selectedTimeRange === 'threeWeeks'
                  ? 'bg-white shadow-sm text-dp-text-primary'
                  : 'text-dp-text-secondary hover:text-dp-text-primary'
              }`}
              onClick={() => setSelectedTimeRange('threeWeeks')}
            >
              Three Weeks
            </button>
          </div>

          {/* Date range selector - matches reference image exactly */}
          <div className="flex items-center">
            <button
              className="p-2 text-dp-text-secondary hover:text-dp-text-primary"
              onClick={handlePrevDate}
              aria-label="Previous date range"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-center space-x-1 px-3 py-2 border border-dp-border-light rounded-md">
              <span className="text-sm font-medium">{selectedDateRange}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-dp-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <button
              className="p-2 text-dp-text-secondary hover:text-dp-text-primary"
              onClick={handleNextDate}
              aria-label="Next date range"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Revert Edits button - matching reference image */}
          <div className="flex items-center">
            <button
              className="px-3 py-1.5 text-sm font-medium text-dp-text-secondary border border-dp-border-light rounded-md hover:bg-dp-background-tertiary transition-colors"
              onClick={onRevertEdits}
              disabled={!hasAdjustedData}
            >
              Revert Edits
            </button>

            {/* View toggles matching reference image exactly */}
            <div className="flex ml-4 border border-dp-border-light rounded-md overflow-hidden">
              <button className="p-2 border-r border-dp-border-light bg-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    className="text-dp-cfa-red"
                  />
                </svg>
              </button>
              <button className="p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v3H4V5zm0 5h16v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    className="text-dp-text-secondary"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Series toggles that match reference image exactly */}
      <div className="px-4 py-3 border-b border-dp-border-light flex flex-wrap gap-x-8 gap-y-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            name="toggle-forecasted"
            id="toggle-forecasted"
            className="form-checkbox text-dp-cfa-red rounded border-dp-border-medium h-4 w-4"
            checked={toggles.forecasted}
            onChange={() => handleToggle('forecasted')}
          />
          <span className="text-xs text-dp-text-primary flex items-center">
            <span className="inline-block w-4 border-b-2 border-dotted border-dp-chart-forecasted mr-1"></span>
            Forecasted
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            name="toggle-edited"
            id="toggle-edited"
            className="form-checkbox text-dp-cfa-red rounded border-dp-border-medium h-4 w-4"
            checked={toggles.edited}
            onChange={() => handleToggle('edited')}
          />
          <span className="text-xs text-dp-text-primary flex items-center">
            <span className="inline-block w-4 h-0.5 bg-dp-chart-edited mr-1"></span>
            Edited
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            name="toggle-actual"
            id="toggle-actual"
            className="form-checkbox text-dp-cfa-red rounded border-dp-border-medium h-4 w-4"
            checked={toggles.actual}
            onChange={() => handleToggle('actual')}
          />
          <span className="text-xs text-dp-text-primary flex items-center">
            <span className="inline-block w-4 h-0.5 bg-dp-chart-actual mr-1"></span>
            Actual
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            name="toggle-actual2024"
            id="toggle-actual2024"
            className="form-checkbox text-dp-cfa-red rounded border-dp-border-medium h-4 w-4"
            checked={toggles.actual2024}
            onChange={() => handleToggle('actual2024')}
          />
          <span className="text-xs text-dp-text-primary flex items-center">
            <span className="inline-block w-4 h-0.5 bg-dp-chart-actual-2024 mr-1"></span>
            2024 Actual
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            name="toggle-actual2023"
            id="toggle-actual2023"
            className="form-checkbox text-dp-cfa-red rounded border-dp-border-medium h-4 w-4"
            checked={toggles.actual2023}
            onChange={() => handleToggle('actual2023')}
          />
          <span className="text-xs text-dp-text-primary flex items-center">
            <span className="inline-block w-4 h-0.5 bg-dp-chart-actual-2023 mr-1"></span>
            2023 Actual
          </span>
        </label>
      </div>

      {/* Chart display */}
      <div className="p-4">
        <ResponsiveChartWrapper aspectRatio={2.75}>
          {(width, height) => (
            <TimeSeriesChart
              width={width}
              height={height}
              baselineData={forecastData.baseline}
              adjustedData={forecastData.adjusted}
              timePeriods={forecastData.timePeriods}
              showForecasted={toggles.forecasted}
              showEdited={toggles.edited}
              showActual={toggles.actual}
              showActual2024={toggles.actual2024}
              showActual2023={toggles.actual2023}
            />
          )}
        </ResponsiveChartWrapper>

        {/* Today pill indicator */}
        <div className="flex justify-center mt-2">
          <div className="px-4 py-1 text-xs font-medium bg-dp-chart-today-pill-bg text-dp-cfa-red rounded-full">
            Today
          </div>
        </div>
      </div>

      {/* X-axis weekday labels exactly matching reference image */}
      <div className="px-6 py-2 flex justify-between text-xs text-dp-chart-axis-text border-t border-dp-border-light">
        <div className="text-center">Mon<br/>May 19</div>
        <div className="text-center">Tue<br/>May 20</div>
        <div className="text-center">Wed<br/>May 21</div>
        <div className="text-center">Thu<br/>May 22</div>
        <div className="text-center">Fri<br/>May 23</div>
        <div className="text-center">Sat<br/>May 24</div>
      </div>

      <div className="mt-1 text-xs text-dp-text-tertiary text-right px-4 pb-2">
        Last updated: {new Date(forecastData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
