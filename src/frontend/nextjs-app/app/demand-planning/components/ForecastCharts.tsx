'use client';

import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { ForecastSeries } from '@/app/types/demand-planning';
import TimeSeriesChart from './charts/TimeSeriesChart';
// ComparisonChart is imported but not used yet
// import ComparisonChart from './charts/ComparisonChart';
import ResponsiveChartWrapper from './charts/ResponsiveChartWrapper';

interface ForecastChartsProps {
  forecastData: ForecastSeries;
  className?: string;
}

// Memoize the component to prevent unnecessary re-renders
const ForecastCharts = memo(function ForecastCharts({
  forecastData,
  className = ''
}: ForecastChartsProps) {
  // Get the lowest inventory item ID and set as default
  const defaultInventoryItemId = useMemo(() => {
    if (!forecastData.inventoryItems || forecastData.inventoryItems.length === 0) {
      return null;
    }
    // Sort inventory items by ID and get the lowest one
    const sortedItems = [...forecastData.inventoryItems].sort((a, b) =>
      parseInt(a.id) - parseInt(b.id)
    );
    return sortedItems[0].id;
  }, [forecastData.inventoryItems]);

  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string | null>(null);

  // Update selected inventory item when default changes
  useEffect(() => {
    if (defaultInventoryItemId && !selectedInventoryItemId) {
      setSelectedInventoryItemId(defaultInventoryItemId);
    }
  }, [defaultInventoryItemId, selectedInventoryItemId]);

  // Filter data by selected inventory item
  const filteredBaselineData = useMemo(() => {
    if (!selectedInventoryItemId) return forecastData.baseline;
    return forecastData.baseline.filter(item =>
      item.inventoryItemId && String(item.inventoryItemId) === String(selectedInventoryItemId)
    );
  }, [forecastData.baseline, selectedInventoryItemId]);

  const filteredAdjustedData = useMemo(() => {
    if (!forecastData.adjusted) return undefined;
    if (!selectedInventoryItemId) return forecastData.adjusted;

    // Filter adjusted data by selected inventory item
    const filtered = forecastData.adjusted.filter(item =>
      item.inventoryItemId && String(item.inventoryItemId) === String(selectedInventoryItemId)
    );

    // Return filtered data or undefined if no data for this item
    return filtered.length > 0 ? filtered : undefined;
  }, [forecastData.adjusted, selectedInventoryItemId]);

  // Handle inventory item selection - memoized to prevent recreation
  const handleInventoryItemChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInventoryItemId(event.target.value);
  }, []);


  return (
    <div className={`bg-dp-surface-primary border border-dp-frame-border rounded-lg shadow-dp-medium ${className}`}>
      <div className="p-4 border-b border-dp-frame-border">
        {/* Control bar with inventory dropdown and view toggles */}
        <div className="flex justify-between items-center">
          {/* LEFT: Inventory Item Dropdown */}
          <div className="flex items-center space-x-2">
            <label htmlFor="inventory-item-select" className="text-sm font-medium text-dp-text-primary">
              Inventory Item:
            </label>
            <select
              id="inventory-item-select"
              value={selectedInventoryItemId || ''}
              onChange={handleInventoryItemChange}
              className="px-3 py-2 text-sm border border-dp-frame-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-dp-surface-primary text-dp-text-primary appearance-none cursor-pointer"
            >
              {forecastData.inventoryItems.map(item => (
                <option key={item.id} value={item.id} className="bg-white text-gray-900">
                  {item.name || `Item ${item.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* RIGHT: View toggles */}
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
