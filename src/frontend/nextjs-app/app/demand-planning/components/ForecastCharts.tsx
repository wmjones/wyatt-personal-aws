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
}

export default function ForecastCharts({
  forecastData,
  className = ''
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
    <div className={`bg-dp-surface-primary border border-dp-frame-border rounded-lg shadow-dp-medium ${className}`}>
      <div className="p-4 border-b border-dp-frame-border">
        {/* Main control container */}
        <div className="flex justify-between items-center">
          {/* LEFT AREA: Time period selector - Day/Week/Three Weeks formatted exactly like screenshot */}
          <div className="flex items-center space-x-4">
            <div className="flex rounded-lg overflow-hidden border border-dp-frame-border">
              <button
                className={`time-period-toggle px-5 py-2 text-sm ${
                  selectedTimeRange === 'day'
                    ? 'active bg-white shadow-dp-light text-dp-text-primary font-medium'
                    : 'bg-dp-background-secondary text-dp-text-secondary hover:text-dp-text-primary'
                }`}
                onClick={() => setSelectedTimeRange('day')}
              >
                Day
              </button>
              <button
                className={`time-period-toggle px-5 py-2 text-sm border-l border-r border-dp-frame-border ${
                  selectedTimeRange === 'week'
                    ? 'active bg-white shadow-dp-light text-dp-text-primary font-medium'
                    : 'bg-dp-background-secondary text-dp-text-secondary hover:text-dp-text-primary'
                }`}
                onClick={() => setSelectedTimeRange('week')}
              >
                Week
              </button>
              <button
                className={`time-period-toggle px-5 py-2 text-sm ${
                  selectedTimeRange === 'threeWeeks'
                    ? 'active bg-white shadow-dp-light text-dp-text-primary font-medium'
                    : 'bg-dp-background-secondary text-dp-text-secondary hover:text-dp-text-primary'
                }`}
                onClick={() => setSelectedTimeRange('threeWeeks')}
              >
                Three Weeks
              </button>
            </div>
          </div>

          {/* CENTER AREA: Date range selector - exactly matching screenshot */}
          <div className="flex items-center absolute left-1/2 transform -translate-x-1/2 space-x-2">
            <button
              className="p-2 text-dp-text-secondary hover:text-dp-text-primary transition-colors rounded-md hover:bg-dp-background-secondary"
              onClick={handlePrevDate}
              aria-label="Previous date range"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="date-range-selector flex items-center">
              <span className="text-sm font-medium">{selectedDateRange}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-dp-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <button
              className="p-2 text-dp-text-secondary hover:text-dp-text-primary transition-colors rounded-md hover:bg-dp-background-secondary"
              onClick={handleNextDate}
              aria-label="Next date range"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* RIGHT AREA: View toggles matching screenshot exactly */}
          <div className="flex items-center">
            <div className="flex border border-dp-frame-border rounded-md overflow-hidden">
              <button className="p-2 border-r border-dp-frame-border bg-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor" className="text-dp-text-secondary" />
                </svg>
              </button>
              <button className="p-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 8h16v13H4V8zm16-5H4v4h16V3z" fill="currentColor" className="text-dp-text-secondary" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Series toggles exactly matching screenshot styling */}
      <div className="px-4 py-3 border-b border-dp-frame-border flex flex-wrap gap-x-8 gap-y-2">
        {/* Forecasted Toggle */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="toggle-forecasted"
            id="toggle-forecasted"
            className="form-checkbox text-primary rounded border-dp-border-medium h-4 w-4 mr-1.5"
            checked={toggles.forecasted}
            onChange={() => handleToggle('forecasted')}
          />
          <div className="flex items-center">
            <span className="inline-block w-3 border-b-2 border-dashed border-dp-chart-forecasted mr-1.5"></span>
            <span className="chart-legend-primary text-xs text-dp-text-secondary">Forecasted</span>
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help">i</span>
          </div>
        </label>

        {/* Edited Toggle */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="toggle-edited"
            id="toggle-edited"
            className="form-checkbox text-primary rounded border-dp-border-medium h-4 w-4 mr-1.5"
            checked={toggles.edited}
            onChange={() => handleToggle('edited')}
          />
          <div className="flex items-center">
            <span className="inline-block w-3 h-0.5 bg-dp-chart-edited mr-1.5"></span>
            <span className="chart-legend-primary text-xs text-dp-text-secondary">Edited</span>
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help">i</span>
          </div>
        </label>

        {/* Actual Toggle */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="toggle-actual"
            id="toggle-actual"
            className="form-checkbox text-primary rounded border-dp-border-medium h-4 w-4 mr-1.5"
            checked={toggles.actual}
            onChange={() => handleToggle('actual')}
          />
          <div className="flex items-center">
            <span className="inline-block w-3 h-0.5 bg-dp-chart-actual mr-1.5"></span>
            <span className="chart-legend-primary text-xs text-dp-text-secondary">Actual</span>
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help">i</span>
          </div>
        </label>

        {/* 2024 Actual Toggle */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="toggle-actual2024"
            id="toggle-actual2024"
            className="form-checkbox text-primary rounded border-dp-border-medium h-4 w-4 mr-1.5"
            checked={toggles.actual2024}
            onChange={() => handleToggle('actual2024')}
          />
          <div className="flex items-center">
            <span className="inline-block w-3 h-0.5 bg-dp-chart-actual-2024 mr-1.5"></span>
            <span className="chart-legend-secondary text-xs text-dp-text-secondary">2024 Actual</span>
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help">i</span>
          </div>
        </label>

        {/* 2023 Actual Toggle */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="toggle-actual2023"
            id="toggle-actual2023"
            className="form-checkbox text-primary rounded border-dp-border-medium h-4 w-4 mr-1.5"
            checked={toggles.actual2023}
            onChange={() => handleToggle('actual2023')}
          />
          <div className="flex items-center">
            <span className="inline-block w-3 h-0.5 bg-dp-chart-actual-2023 mr-1.5"></span>
            <span className="chart-legend-secondary text-xs text-dp-text-secondary">2023 Actual</span>
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help">i</span>
          </div>
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
          <div className="px-4 py-1 text-xs font-medium bg-dp-chart-today-pill-bg text-primary rounded-full">
            Today
          </div>
        </div>
      </div>

      {/* X-axis weekday labels exactly matching reference image */}
      <div className="px-6 py-2 flex justify-between text-xs text-dp-chart-axis-text border-t border-dp-frame-border">
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
