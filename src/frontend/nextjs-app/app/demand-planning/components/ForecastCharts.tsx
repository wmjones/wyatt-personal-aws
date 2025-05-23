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
  // Date range selection state
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-04-01');

  // Toggle state for forecast data series (using actual column names)
  const [toggles, setToggles] = useState({
    y_05: true,   // Lower confidence interval
    y_50: true,   // Median forecast
    y_95: true,   // Upper confidence interval
    edited: true,
    actual: true
  });


  // Toggle data series display
  const handleToggle = (series: keyof typeof toggles) => {
    setToggles(prev => ({
      ...prev,
      [series]: !prev[series]
    }));
  };

  // Handle date changes
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
  };

  return (
    <div className={`bg-dp-surface-primary border border-dp-frame-border rounded-lg shadow-dp-medium ${className}`}>
      <div className="p-4 border-b border-dp-frame-border">
        {/* Main control container */}
        <div className="flex justify-between items-center">
          {/* LEFT AREA: Date range selectors */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="start-date" className="text-sm font-medium text-dp-text-primary">Start Date:</label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={handleStartDateChange}
                className="px-3 py-2 text-sm border border-dp-frame-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                min="2025-01-01"
                max="2025-12-31"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="end-date" className="text-sm font-medium text-dp-text-primary">End Date:</label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={handleEndDateChange}
                className="px-3 py-2 text-sm border border-dp-frame-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                min="2025-01-01"
                max="2025-12-31"
              />
            </div>
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

      {/* Series toggles with actual forecast column names */}
      <div className="px-4 py-3 border-b border-dp-frame-border flex flex-wrap gap-x-8 gap-y-2">
        {/* y_05 Toggle (Lower Confidence Interval) */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="toggle-y_05"
            id="toggle-y_05"
            className="form-checkbox text-primary rounded border-dp-border-medium h-4 w-4 mr-1.5"
            checked={toggles.y_05}
            onChange={() => handleToggle('y_05')}
          />
          <div className="flex items-center">
            <span className="inline-block w-3 border-b-2 border-dashed border-dp-chart-forecasted mr-1.5"></span>
            <span className="chart-legend-primary text-xs text-dp-text-secondary">y_05 (Lower)</span>
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help" title="5th percentile forecast">i</span>
          </div>
        </label>

        {/* y_50 Toggle (Median Forecast) */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="toggle-y_50"
            id="toggle-y_50"
            className="form-checkbox text-primary rounded border-dp-border-medium h-4 w-4 mr-1.5"
            checked={toggles.y_50}
            onChange={() => handleToggle('y_50')}
          />
          <div className="flex items-center">
            <span className="inline-block w-3 h-0.5 bg-dp-chart-forecasted mr-1.5"></span>
            <span className="chart-legend-primary text-xs text-dp-text-secondary">y_50 (Median)</span>
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help" title="50th percentile forecast">i</span>
          </div>
        </label>

        {/* y_95 Toggle (Upper Confidence Interval) */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="toggle-y_95"
            id="toggle-y_95"
            className="form-checkbox text-primary rounded border-dp-border-medium h-4 w-4 mr-1.5"
            checked={toggles.y_95}
            onChange={() => handleToggle('y_95')}
          />
          <div className="flex items-center">
            <span className="inline-block w-3 border-b-2 border-dotted border-dp-chart-forecasted mr-1.5"></span>
            <span className="chart-legend-primary text-xs text-dp-text-secondary">y_95 (Upper)</span>
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help" title="95th percentile forecast">i</span>
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
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help" title="Manually adjusted forecast">i</span>
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
            <span className="inline-block w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 cursor-help" title="Actual observed values">i</span>
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
              startDate={startDate}
              endDate={endDate}
              showY05={toggles.y_05}
              showY50={toggles.y_50}
              showY95={toggles.y_95}
              showEdited={toggles.edited}
              showActual={toggles.actual}
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

      {/* X-axis labels for 3-month view */}
      <div className="px-6 py-2 flex justify-between text-xs text-dp-chart-axis-text border-t border-dp-frame-border">
        <div className="text-center">Jan<br/>2025</div>
        <div className="text-center">Feb<br/>2025</div>
        <div className="text-center">Mar<br/>2025</div>
        <div className="text-center">Apr<br/>2025</div>
      </div>

      <div className="mt-1 text-xs text-dp-text-tertiary text-right px-4 pb-2">
        Last updated: {new Date(forecastData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
