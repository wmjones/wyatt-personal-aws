'use client';

import { memo, useMemo } from 'react';
import { ForecastSeries } from '@/app/types/demand-planning';
import TimeSeriesChartWithTransitions from './charts/TimeSeriesChartWithTransitions';
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
    // If we have saved adjustments in the data, extract them
    if (hasSavedAdjustments) {
      // Create adjusted data from the baseline data using adjusted_y_50 values
      const adjustedPoints = forecastData.baseline
        .filter(point => point.adjusted_y_50 !== undefined)
        .map(point => ({
          ...point,
          value: point.adjusted_y_50!,
          y_50: point.adjusted_y_50!
        }));

      console.log('ForecastCharts - Extracted adjusted points:', adjustedPoints.length);
      if (adjustedPoints.length > 0) {
        console.log('ForecastCharts - Sample adjusted point:', adjustedPoints[0]);
      }

      return adjustedPoints;
    }

    // If there's a real-time adjustment value, apply it
    if (adjustmentValue !== 0) {
      console.log('ForecastCharts - Applying real-time adjustment:', adjustmentValue);
      return forecastData.baseline.map(point => ({
        ...point,
        value: point.y_50 ? applyAdjustmentToForecast(point.y_50, adjustmentValue) : applyAdjustmentToForecast(point.value, adjustmentValue),
        y_05: point.y_05,
        y_50: point.y_50 ? applyAdjustmentToForecast(point.y_50, adjustmentValue) : applyAdjustmentToForecast(point.value, adjustmentValue),
        y_95: point.y_95
      }));
    }

    // No adjustments - return empty array
    console.log('ForecastCharts - No adjustments to display');
    return [];
  }, [adjustmentValue, forecastData.baseline, hasSavedAdjustments]);


  return (
    <div className={`bg-white border border-dp-frame-border rounded-lg shadow-dp-medium ${className}`}>


      {/* Chart display */}
      <div>
        <ResponsiveChartWrapper aspectRatio={2.75}>
          {(width, height) => {
            console.log('ForecastCharts - Passing to TimeSeriesChart:');
            console.log('- Baseline data points:', filteredBaselineData.length);
            console.log('- Adjusted data points:', filteredAdjustedData.length);
            return (
              <TimeSeriesChartWithTransitions
                width={width}
                height={height}
                baselineData={filteredBaselineData}
                adjustedData={filteredAdjustedData}
                timePeriods={forecastData.timePeriods}
                showY05={true}
                showY50={true}
                showY95={true}
              />
            );
          }}
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
