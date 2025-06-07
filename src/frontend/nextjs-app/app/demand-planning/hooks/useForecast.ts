'use client';

import { useForecastData } from './useForecastQuery';
import {
  ForecastSeries,
  ForecastDataPoint,
  TimePeriod,
  InventoryItem
} from '@/app/types/demand-planning';
import { FilterSelections } from '../components/FilterSidebar';

interface UseForecastProps {
  filterSelections?: FilterSelections;
}

/**
 * Transform forecast API response to ForecastSeries format
 */
function transformToForecastSeries(
  data: { timeSeries: Array<{
    business_date: string;
    inventory_item_id: string;
    state: string;
    dma_id: string;
    dc_id: string;
    y_05: number;
    y_50: number;
    y_95: number;
    // New adjustment fields
    original_y_05?: number;
    original_y_50?: number;
    original_y_95?: number;
    adjusted_y_50?: number;
    total_adjustment_percent?: number;
    adjustment_count?: number;
  }> }
): ForecastSeries {
  // Extract unique dates and create time periods
  const datesSet = new Set<string>();
  const inventoryItemsMap = new Map<string, InventoryItem>();
  const forecastData: ForecastDataPoint[] = [];

  // Validate data structure
  if (!data || !data.timeSeries || !Array.isArray(data.timeSeries)) {
    console.warn('Invalid data structure passed to transformToForecastSeries:', data);
    return {
      id: `forecast-${Date.now()}`,
      timePeriods: [],
      baseline: [],
      inventoryItems: [],
      lastUpdated: new Date().toISOString()
    };
  }

  data.timeSeries.forEach((row) => {
    // Ensure business_date exists before processing
    if (!row.business_date) {
      console.warn('Row missing business_date:', row);
      return;
    }
    const date = row.business_date.split('T')[0];
    datesSet.add(date);

    // Track inventory items
    if (row.inventory_item_id) {
      inventoryItemsMap.set(row.inventory_item_id, {
        id: row.inventory_item_id,
        name: `Item ${row.inventory_item_id}`
      });
    }

    // Check if this data point has adjustments
    const hasAdjustment = row.adjustment_count !== undefined && row.adjustment_count > 0;

    // Use adjusted value if available, otherwise use original
    const displayValue = hasAdjustment && row.adjusted_y_50 !== undefined
      ? row.adjusted_y_50
      : row.y_50 || 0;

    forecastData.push({
      periodId: `day-${date}`,
      value: displayValue,
      inventoryItemId: row.inventory_item_id,
      state: row.state,
      dmaId: row.dma_id,
      dcId: row.dc_id,
      y_05: row.y_05 || 0,
      y_50: row.y_50 || 0,
      y_95: row.y_95 || 0,
      // Include adjustment data
      original_y_05: row.original_y_05,
      original_y_50: row.original_y_50,
      original_y_95: row.original_y_95,
      adjusted_y_50: row.adjusted_y_50,
      total_adjustment_percent: row.total_adjustment_percent,
      adjustment_count: row.adjustment_count,
      hasAdjustment
    });
  });

  const timePeriods: TimePeriod[] = Array.from(datesSet)
    .sort()
    .map(dateStr => {
      const date = new Date(dateStr);
      return {
        id: `day-${dateStr}`,
        name: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        startDate: dateStr,
        endDate: dateStr,
        type: 'day' as const
      };
    });

  return {
    id: `forecast-${Date.now()}`,
    timePeriods,
    baseline: forecastData,
    inventoryItems: Array.from(inventoryItemsMap.values()),
    lastUpdated: new Date().toISOString()
  };
}

export default function useForecast({ filterSelections }: UseForecastProps) {
  // Extract query parameters - only use selected item from filterSelections
  const itemIds = filterSelections?.inventoryItemId
    ? [filterSelections.inventoryItemId]
    : [];

  // Determine date range from filter selections
  let startDate = '';
  let endDate = '';

  if (filterSelections?.dateRange?.startDate && filterSelections?.dateRange?.endDate) {
    startDate = filterSelections.dateRange.startDate;
    endDate = filterSelections.dateRange.endDate;
  } else {
    // Default to full data range: Jan 1 to Mar 31
    startDate = '2025-01-01';
    endDate = '2025-03-31';
  }

  // Use TanStack Query hook with proper location filters
  const queryParams = {
    itemIds,
    startDate,
    endDate,
    states: filterSelections?.states || [],
    dmaIds: filterSelections?.dmaIds || [],
    dcIds: filterSelections?.dcIds || []
  };

  // Debug logging
  console.log('useForecast - Query params:', queryParams);

  const { data, isLoading, error, refetch } = useForecastData(queryParams);

  // Transform data to expected format
  const forecastData = data && itemIds.length > 0
    ? transformToForecastSeries(data)
    : null;

  // Debug logging
  if (data && !forecastData) {
    console.log('Data exists but forecastData is null. ItemIds:', itemIds);
  }

  return {
    isLoading,
    forecastData,
    error: error?.message || null,
    refetch
  };
}
