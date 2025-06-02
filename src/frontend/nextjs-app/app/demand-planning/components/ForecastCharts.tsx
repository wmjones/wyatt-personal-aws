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

  // Apply real-time adjustment to create adjusted data - memoized for performance
  const filteredAdjustedData = useMemo(() => {
    if (adjustmentValue === 0) {
      return forecastData.adjusted;
    }

    return forecastData.baseline.map(point => ({
      ...point,
      value: point.y_50 ? applyAdjustmentToForecast(point.y_50, adjustmentValue) : applyAdjustmentToForecast(point.value, adjustmentValue),
      y_05: point.y_05,
      y_50: point.y_50 ? applyAdjustmentToForecast(point.y_50, adjustmentValue) : applyAdjustmentToForecast(point.value, adjustmentValue),
      y_95: point.y_95
    }));
  }, [adjustmentValue, forecastData.baseline, forecastData.adjusted]);


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
});

export default ForecastCharts;
