'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ForecastSeries,
  ForecastDataPoint,
  TimePeriod,
  HierarchySelection
} from '@/app/types/demand-planning';
import { FilterSelections } from '../components/FilterSidebar';
import { createAdjustment } from '../services/adjustmentService';
import { AdjustmentData } from '../components/AdjustmentModal';
import { hybridForecastService } from '@/app/services/hybridForecastService';
import { AthenaQueryResponse } from '@/app/services/athenaService';

interface UseForecastProps {
  hierarchySelections: HierarchySelection[];
  timePeriodIds: string[];
  filterSelections?: FilterSelections;
}

/**
 * Transform Athena query response to ForecastDataPoint array and generate periods from actual data
 */
function transformAthenaToForecastData(
  athenaResponse: AthenaQueryResponse
): { forecastData: ForecastDataPoint[], inventoryItems: { id: string, name: string }[], timePeriods: TimePeriod[] } {
  const forecastData: ForecastDataPoint[] = [];
  const inventoryItemsMap = new Map<string, string>();
  const datesSet = new Set<string>();

  // Expected Athena columns: [business_date, inventory_item_id, restaurant_id, state, dma_id, dc_id, y_50]
  athenaResponse.data.rows.forEach(row => {
    const [businessDate, inventoryItemId, , state, dmaId, dcId, y50Value] = row;

    // Normalize business date format (handle both strings and Date objects)
    const normalizedDate = typeof businessDate === 'string'
      ? businessDate
      : businessDate && typeof businessDate === 'object' && 'toISOString' in businessDate
        ? (businessDate as Date).toISOString().split('T')[0]
        : String(businessDate);

    // Track unique dates
    datesSet.add(normalizedDate);

    // Track inventory items
    inventoryItemsMap.set(inventoryItemId, `Item ${inventoryItemId}`);

    // Generate period ID for this date
    const periodId = `day-${normalizedDate}`;

    forecastData.push({
      periodId,
      value: parseFloat(y50Value) || 0,
      inventoryItemId,
      state,
      dmaId,
      dcId,
    });
  });

  // Generate time periods from actual dates in the data
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

  // Convert inventory items map to array
  const inventoryItems = Array.from(inventoryItemsMap.entries()).map(([id, name]) => ({
    id,
    name
  }));

  return { forecastData, inventoryItems, timePeriods };
}

export default function useForecast({ hierarchySelections, timePeriodIds, filterSelections }: UseForecastProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastSeries | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableDateRange, setAvailableDateRange] = useState<{ min: string; max: string } | null>(null);

  // Add refs for managing requests and debouncing
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get available date range from Athena on first load
  const getAvailableDateRange = useCallback(async () => {
    try {
      const response = await hybridForecastService.executeQuery(
        'SELECT MIN(business_date) as min_date, MAX(business_date) as max_date FROM forecast'
      );

      if (response.data.rows.length > 0) {
        const [minDate, maxDate] = response.data.rows[0];
        const normalizedMin = typeof minDate === 'string' ? minDate : String(minDate);
        const normalizedMax = typeof maxDate === 'string' ? maxDate : String(maxDate);

        setAvailableDateRange({
          min: normalizedMin,
          max: normalizedMax
        });

        return { min: normalizedMin, max: normalizedMax };
      }
    } catch (error) {
      console.error('Error getting date range:', error);
    }
    return null;
  }, []);

  // Create a memoized fetch function to avoid dependency issues
  const fetchForecast = useCallback(async () => {
    console.log("useForecast: fetchForecast callback triggered");

    // Create a new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Get available date range first if we don't have it
    let dateRange = availableDateRange;
    if (!dateRange) {
      dateRange = await getAvailableDateRange();
      if (!dateRange) {
        setError('Unable to determine available date range from database');
        setIsLoading(false);
        return;
      }
    }

    // If no time periods are selected, use the full available range
    let startDate: string;
    let endDate: string;

    if (timePeriodIds.length === 0) {
      console.log("useForecast: No time periods selected, using full date range");
      startDate = dateRange.min;
      endDate = dateRange.max;
    } else {
      // Extract dates from period IDs (format: "day-YYYY-MM-DD")
      const selectedDates = timePeriodIds
        .map(id => id.replace('day-', ''))
        .filter(date => date.match(/^\d{4}-\d{2}-\d{2}$/))
        .sort();

      if (selectedDates.length === 0) {
        throw new Error('No valid date periods selected');
      }

      startDate = selectedDates[0];
      endDate = selectedDates[selectedDates.length - 1];
    }

    console.log("useForecast: Starting real data fetch");
    setIsLoading(true);
    setError(null);

    try {
      // Build filters for Athena query
      const filters: {
        startDate: string;
        endDate: string;
        state?: string | string[];
      } = {
        startDate,
        endDate,
      };

      // Add location filters if specified
      if (filterSelections) {
        if (filterSelections.states.length > 0) {
          // Pass all selected states to Athena
          filters.state = filterSelections.states.length === 1
            ? filterSelections.states[0]
            : filterSelections.states;
        }
        // Note: athenaService doesn't currently support dmaIds or dcIds filters
        // These are handled via client-side filtering after Athena query
      }

      console.log("useForecast: Querying with filters:", filters);

      // Query real data from hybrid service
      const athenaResponse = await hybridForecastService.getForecastData(filters);

      console.log("useForecast: Received Athena response:", {
        columns: athenaResponse.data.columns,
        rowCount: athenaResponse.data.rows.length
      });

      // Check if we got any data
      if (!athenaResponse.data.rows || athenaResponse.data.rows.length === 0) {
        throw new Error('No forecast data found for the selected filters and date range. Try adjusting your filters or date range.');
      }

      // Transform Athena data to forecast format - this now generates periods from actual data
      const { forecastData: rawForecastData, inventoryItems, timePeriods } = transformAthenaToForecastData(
        athenaResponse
      );

      // Check if transformation yielded any data
      if (rawForecastData.length === 0) {
        throw new Error('No forecast data matches the selected time periods. The data may be outside the selected date range.');
      }

      // Aggregate data by inventory item and period (same logic as before)
      const aggregationMap = new Map<string, ForecastDataPoint>();

      rawForecastData.forEach(dataPoint => {
        // Apply client-side filtering for unsupported filters (DMA, DC)
        if (filterSelections) {
          const { dmaIds, dcIds } = filterSelections;

          if (dmaIds.length > 0 && !dmaIds.includes(dataPoint.dmaId || '')) {
            return;
          }
          if (dcIds.length > 0 && !dcIds.includes(dataPoint.dcId || '')) {
            return;
          }
        }

        const key = `${dataPoint.inventoryItemId}-${dataPoint.periodId}`;

        if (aggregationMap.has(key)) {
          const existing = aggregationMap.get(key)!;
          existing.value += dataPoint.value;
        } else {
          aggregationMap.set(key, {
            periodId: dataPoint.periodId,
            value: dataPoint.value,
            inventoryItemId: dataPoint.inventoryItemId,
          });
        }
      });

      const baseline = Array.from(aggregationMap.values());

      console.log("useForecast: Real data processing complete:", {
        hasFilters: !!filterSelections,
        stateFilter: filters.state || 'none',
        rawDataPoints: rawForecastData.length,
        aggregatedDataPoints: baseline.length,
        uniqueItems: new Set(baseline.map(d => d.inventoryItemId)).size,
        uniquePeriods: new Set(baseline.map(d => d.periodId)).size,
        inventoryItemCount: inventoryItems.length,
        periodsGenerated: timePeriods.length,
        dateRange: `${timePeriods[0]?.startDate} to ${timePeriods[timePeriods.length - 1]?.startDate}`
      });

      // Create the forecast series
      const realForecast: ForecastSeries = {
        id: `forecast-${Date.now()}`,
        hierarchySelections,
        timePeriods, // Use the dynamically generated periods from actual data
        baseline,
        inventoryItems,
        lastUpdated: new Date().toISOString(),
      };

      setForecastData(realForecast);
    } catch (error) {
      // Handle abort errors silently
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("useForecast: Fetch request was aborted");
        return;
      }

      console.error('Error fetching real forecast data:', error);
      setError(`Failed to fetch forecast data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Only clear loading state if this wasn't aborted
      if (abortControllerRef.current === abortController) {
        console.log("useForecast: Completed real data fetch");
        setIsLoading(false);
      }
    }
  }, [hierarchySelections, timePeriodIds, filterSelections, availableDateRange, getAvailableDateRange]);

  // Load available date range on mount
  useEffect(() => {
    getAvailableDateRange();
  }, [getAvailableDateRange]);

  // Trigger the fetch operation when inputs change with debouncing
  useEffect(() => {
    console.log("useForecast effect triggered with:", {
      hierarchySelections,
      timePeriodIds,
      selectionCount: hierarchySelections.length,
      periodCount: timePeriodIds.length,
      hasFilters: filterSelections && (
        filterSelections.states.length > 0 ||
        filterSelections.dmaIds.length > 0 ||
        filterSelections.dcIds.length > 0
      )
    });

    // Cancel any pending debounced calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Skip fetch if no filters are selected - wait for user to make selections
    if (!filterSelections || (
      filterSelections.states.length === 0 &&
      filterSelections.dmaIds.length === 0 &&
      filterSelections.dcIds.length === 0
    )) {
      console.log("useForecast: Skipping fetch - no filters selected");
      setForecastData(null);
      setIsLoading(false);
      return;
    }

    // Debounce the fetch operation by 300ms to avoid rapid API calls
    debounceTimerRef.current = setTimeout(() => {
      fetchForecast();
    }, 300);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchForecast, hierarchySelections, timePeriodIds, filterSelections]);

  // Apply adjustment to forecast using the adjustment service
  const applyAdjustment = async (adjustment: AdjustmentData): Promise<void> => {
    if (!forecastData) return;

    setIsLoading(true);

    try {
      // Create the adjustment in the service (which would normally save to backend)
      await createAdjustment(adjustment, forecastData);

      // Clone the current forecast data
      const updatedForecast = { ...forecastData };

      // Apply the adjustment to the baseline data
      const adjusted = forecastData.baseline.map(point => {
        // Skip if this time period is not in the adjustment
        if (!adjustment.timePeriods.includes(point.periodId)) {
          // If we already have adjusted data for this period and same inventory item, use it
          const existingAdjusted = forecastData.adjusted?.find(p =>
            p.periodId === point.periodId &&
            p.inventoryItemId === point.inventoryItemId
          );
          return existingAdjusted || {
            periodId: point.periodId,
            value: point.value,
            inventoryItemId: point.inventoryItemId
          };
        }

        // Calculate the new value based on adjustment type
        let newValue: number;

        if (adjustment.type === 'percentage') {
          newValue = point.value * (1 + adjustment.value / 100);
        } else { // absolute
          newValue = point.value + adjustment.value;
        }

        // Ensure we don't go below zero
        newValue = Math.max(0, newValue);

        return {
          periodId: point.periodId,
          value: Math.round(newValue),
          inventoryItemId: point.inventoryItemId,
        };
      });

      // Update the forecast with the adjusted data
      updatedForecast.adjusted = adjusted;
      updatedForecast.lastUpdated = new Date().toISOString();

      setForecastData(updatedForecast);
    } catch (error) {
      console.error('Error applying adjustment:', error);
      setError('Failed to apply adjustment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset adjustments (return to baseline)
  const resetAdjustments = async (): Promise<void> => {
    if (!forecastData) return;

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400));

      // Clone the current forecast data without adjustments
      const updatedForecast = {
        ...forecastData,
        adjusted: undefined,
        lastUpdated: new Date().toISOString(),
      };

      setForecastData(updatedForecast);
    } catch (error) {
      console.error('Error resetting adjustments:', error);
      setError('Failed to reset adjustments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh forecast data
  const refreshForecast = async (): Promise<void> => {
    if (!forecastData) return;

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Small random adjustments to baseline to simulate refreshed data
      const refreshedBaseline = forecastData.baseline.map(point => ({
        periodId: point.periodId,
        value: Math.round(point.value * (0.97 + Math.random() * 0.06)),
        inventoryItemId: point.inventoryItemId,
      }));

      // If we have adjustments, apply them to the new baseline
      let refreshedAdjusted;
      if (forecastData.adjusted) {
        refreshedAdjusted = forecastData.baseline.map((baselinePoint, index) => {
          // Find the corresponding adjusted point
          const originalBaseline = forecastData.baseline.find(
            p => p.periodId === baselinePoint.periodId &&
            p.inventoryItemId === baselinePoint.inventoryItemId
          );
          const originalAdjusted = forecastData.adjusted?.find(
            p => p.periodId === baselinePoint.periodId &&
            p.inventoryItemId === baselinePoint.inventoryItemId
          );

          // If we don't have both original points, return the baseline
          if (!originalBaseline || !originalAdjusted) {
            return refreshedBaseline[index];
          }

          // Calculate the adjustment factor from the original data
          const adjustmentFactor = originalAdjusted.value / originalBaseline.value;

          // Apply the same factor to the refreshed baseline
          return {
            periodId: baselinePoint.periodId,
            value: Math.round(refreshedBaseline[index].value * adjustmentFactor),
            inventoryItemId: baselinePoint.inventoryItemId,
          };
        });
      }

      const refreshedForecast: ForecastSeries = {
        ...forecastData,
        baseline: refreshedBaseline,
        adjusted: refreshedAdjusted,
        lastUpdated: new Date().toISOString(),
      };

      setForecastData(refreshedForecast);
    } catch (error) {
      console.error('Error refreshing forecast data:', error);
      setError('Failed to refresh forecast data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    forecastData,
    error,
    availableDateRange,
    applyAdjustment,
    resetAdjustments,
    refreshForecast,
  };
}
