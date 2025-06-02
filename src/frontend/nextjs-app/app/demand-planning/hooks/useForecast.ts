'use client';

import { useEffect, useState } from 'react';
import { useForecastData } from './useForecastQuery';
import {
  ForecastSeries,
  ForecastDataPoint,
  TimePeriod,
  InventoryItem
} from '@/app/types/demand-planning';
import { FilterSelections } from '../components/FilterSidebar';
import { postgresForecastService } from '@/app/services/postgresForecastService';

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
  }> }
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
    timePeriods,
    baseline: forecastData,
    inventoryItems: Array.from(inventoryItemsMap.values()),
    lastUpdated: new Date().toISOString()
  };
}

export default function useForecast({ filterSelections }: UseForecastProps) {
  const [firstInventoryItemId, setFirstInventoryItemId] = useState<string | null>(null);
  const [isLoadingFirstItem, setIsLoadingFirstItem] = useState(true);

  // Fetch first available inventory item on mount if no item is selected
  useEffect(() => {
    const fetchFirstInventoryItem = async () => {
      if (filterSelections?.inventoryItemId) {
        setIsLoadingFirstItem(false);
        return;
      }

      try {
        const inventoryItems = await postgresForecastService.getDistinctInventoryItems();
        if (inventoryItems.length > 0) {
          const firstItem = inventoryItems[0];
          console.log(`Auto-selecting first inventory item: ${firstItem} (from ${inventoryItems.length} available items)`);
          setFirstInventoryItemId(firstItem);
        }
      } catch (error) {
        console.error('Failed to fetch first inventory item:', error);
      } finally {
        setIsLoadingFirstItem(false);
      }
    };

    fetchFirstInventoryItem();
  }, [filterSelections?.inventoryItemId]);

  // Extract query parameters - use first available item if no item is selected
  const itemIds = filterSelections?.inventoryItemId
    ? [filterSelections.inventoryItemId]
    : firstInventoryItemId
    ? [firstInventoryItemId]
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
  const { data, isLoading, error, refetch } = useForecastData({
    itemIds,
    startDate,
    endDate,
    states: filterSelections?.states || [],
    dmaIds: filterSelections?.dmaIds || [],
    dcIds: filterSelections?.dcIds || []
  });

  // Transform data to expected format
  const forecastData = data && itemIds.length > 0
    ? transformToForecastSeries(data)
    : null;

  return {
    isLoading: isLoading || isLoadingFirstItem,
    forecastData,
    error: error?.message || null,
    refetch
  };
}
