'use client';

import { memo, useMemo } from 'react';
import { ForecastSeries } from '@/app/types/demand-planning';
import TimeSeriesChart from './charts/TimeSeriesChart';
// ComparisonChart is imported but not used yet
// import ComparisonChart from './charts/ComparisonChart';
import ResponsiveChartWrapper from './charts/ResponsiveChartWrapper';
import { applyAdjustmentToForecast } from '../lib/adjustment-utils';

interface ForecastChartsProps {
  forecastData: ForecastSeries;
  adjustmentValue?: number; // Real-time adjustment percentage
  className?: string;
}

// Memoize the component to prevent unnecessary re-renders
const ForecastCharts = memo(function ForecastCharts({
  forecastData,
  adjustmentValue = 0,
  className = ''
}: ForecastChartsProps) {
  // Use the data as-is since filtering is now done by the parent component
  const filteredBaselineData = forecastData.baseline;

  // Debug logging
  console.log('ForecastCharts - Received data points:', filteredBaselineData.length);
  console.log('ForecastCharts - Time periods:', forecastData.timePeriods.length);

  // Check if we have saved adjustments in the baseline data
  const hasSavedAdjustments = useMemo(() => {
    return forecastData.baseline.some(point => point.hasAdjustment);
  }, [forecastData.baseline]);

  // Apply real-time adjustment to create adjusted data - memoized for performance
  const filteredAdjustedData = useMemo(() => {
    // If we have saved adjustments, don't apply real-time adjustments on top
    if (hasSavedAdjustments || adjustmentValue === 0) {
      return forecastData.adjusted;
    }

    // Only apply real-time adjustments if there are no saved adjustments
    return forecastData.baseline.map(point => ({
      ...point,
      value: point.y_50 ? applyAdjustmentToForecast(point.y_50, adjustmentValue) : applyAdjustmentToForecast(point.value, adjustmentValue),
      y_05: point.y_05,
      y_50: point.y_50 ? applyAdjustmentToForecast(point.y_50, adjustmentValue) : applyAdjustmentToForecast(point.value, adjustmentValue),
      y_95: point.y_95
    }));
  }, [adjustmentValue, forecastData.baseline, forecastData.adjusted, hasSavedAdjustments]);


  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-dp-medium ${className}`}>


      {/* Chart display */}
      <div className="p-4">
        <ResponsiveChartWrapper aspectRatio={2.75}>
          {(width, height) => (
            <TimeSeriesChart
              width={width}
              height={height}
              baselineData={filteredBaselineData}
              adjustedData={filteredAdjustedData}
              timePeriods={forecastData.timePeriods}
              showY05={true}
              showY50={true}
              showY95={true}
              showEdited={true}
              showActual={true}
            />
          )}
        </ResponsiveChartWrapper>

        {/* Today pill removed per user request */}
      </div>

      {/* Dynamic x-axis labels based on actual date range */}
      <div className="px-6 py-2 text-xs text-dp-chart-axis-text border-t border-dp-frame-border">
        <div className="text-center">
          {forecastData.timePeriods.length > 0 ? (
            <span>
              {new Date(forecastData.timePeriods[0].startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' - '}
              {new Date(forecastData.timePeriods[forecastData.timePeriods.length - 1].endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          ) : (
            <span>No data available</span>
          )}
        </div>
      </div>

      <div className="mt-1 text-xs text-dp-text-tertiary text-right px-4 pb-2">
        Last updated: {new Date(forecastData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
});

export default ForecastCharts;
