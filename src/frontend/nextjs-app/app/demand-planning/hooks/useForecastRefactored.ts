'use client';

import { useCallback } from 'react';
import { useForecastData } from './useForecastQuery';
import {
  ForecastSeries,
  ForecastDataPoint,
  TimePeriod,
  HierarchySelection,
  InventoryItem
} from '@/app/types/demand-planning';
import { FilterSelections } from '../components/FilterSidebar';
import { createAdjustment } from '../services/adjustmentService';
import { AdjustmentData } from '../components/AdjustmentModal';

interface UseForecastProps {
  hierarchySelections: HierarchySelection[];
  timePeriodIds: string[];
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
  }> },
  hierarchySelections: HierarchySelection[]
): ForecastSeries {
  // Extract unique dates and create time periods
  const datesSet = new Set<string>();
  const inventoryItemsMap = new Map<string, InventoryItem>();
  const forecastData: ForecastDataPoint[] = [];

  data.timeSeries.forEach((row) => {
    const date = row.business_date.split('T')[0];
    datesSet.add(date);

    // Track inventory items
    if (row.inventory_item_id) {
      inventoryItemsMap.set(row.inventory_item_id, {
        id: row.inventory_item_id,
        name: `Item ${row.inventory_item_id}`
      });
    }

    forecastData.push({
      periodId: `day-${date}`,
      value: row.y_50 || 0,
      inventoryItemId: row.inventory_item_id,
      state: row.state,
      dmaId: row.dma_id,
      dcId: row.dc_id,
      y_05: row.y_05 || 0,
      y_50: row.y_50 || 0,
      y_95: row.y_95 || 0,
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
    hierarchySelections,
    timePeriods,
    baseline: forecastData,
    inventoryItems: Array.from(inventoryItemsMap.values()),
    lastUpdated: new Date().toISOString()
  };
}

export default function useForecast({ hierarchySelections, timePeriodIds, filterSelections }: UseForecastProps) {
  // Extract query parameters
  const itemIds = filterSelections?.inventoryItemId ? [filterSelections.inventoryItemId] : [];
  const locationIds = [
    ...(filterSelections?.states || []),
    ...(filterSelections?.dmaIds || []),
    ...(filterSelections?.dcIds || [])
  ];

  // Determine date range
  let startDate = '';
  let endDate = '';

  if (timePeriodIds.length > 0) {
    const selectedDates = timePeriodIds
      .map(id => id.replace('day-', ''))
      .filter(date => date.match(/^\d{4}-\d{2}-\d{2}$/))
      .sort();

    if (selectedDates.length > 0) {
      startDate = selectedDates[0];
      endDate = selectedDates[selectedDates.length - 1];
    }
  } else {
    // Default to last 30 days if no periods selected
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate = thirtyDaysAgo.toISOString().split('T')[0];
    endDate = now.toISOString().split('T')[0];
  }

  // Use TanStack Query hook
  const { data, isLoading, error, refetch } = useForecastData({
    itemIds,
    locationIds,
    startDate,
    endDate
  });

  // Transform data to expected format
  const forecastData = data && itemIds.length > 0
    ? transformToForecastSeries(data, hierarchySelections)
    : null;

  // Apply adjustment handler
  const applyAdjustment = useCallback(async (adjustmentData: AdjustmentData) => {
    if (!forecastData) return;

    try {
      await createAdjustment(adjustmentData, forecastData);

      // Refetch data to get updated forecast with adjustments
      await refetch();
    } catch (error) {
      console.error('Failed to apply adjustment:', error);
      throw error;
    }
  }, [forecastData, refetch]);

  return {
    isLoading,
    forecastData,
    error: error?.message || null,
    availableDateRange: null, // This can be fetched separately if needed
    applyAdjustment,
    refetch
  };
}
