'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ForecastSeries,
  ForecastDataPoint,
  TimePeriod,
  HierarchySelection
} from '@/app/types/demand-planning';
import { FilterSelections } from '../components/FilterSidebar';
import { createAdjustment } from '../services/adjustmentService';
import { AdjustmentData } from '../components/AdjustmentModal';

interface UseForecastProps {
  hierarchySelections: HierarchySelection[];
  timePeriodIds: string[];
  filterSelections?: FilterSelections;
}

export default function useForecast({ hierarchySelections, timePeriodIds, filterSelections }: UseForecastProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastSeries | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock time periods with useMemo to avoid recreation on each render
  // Updated to show full date range from 2025-01-01 to 2025-04-01
  const mockTimePeriods = useMemo<TimePeriod[]>(() => {
    const periods: TimePeriod[] = [];
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-04-01');

    // Generate daily periods for the full range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      periods.push({
        id: `day-${dateStr}`,
        name: currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        startDate: dateStr,
        endDate: dateStr,
        type: 'day'
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return periods;
  }, []);

  // Create a memoized fetch function to avoid dependency issues
  const fetchForecast = useCallback(async () => {
    console.log("useForecast: fetchForecast callback triggered");

    // Skip if no selections are made
    if (hierarchySelections.length === 0 || timePeriodIds.length === 0) {
      console.log("useForecast: No selections, skipping data fetch");
      setForecastData(null);
      return;
    }

    console.log("useForecast: Starting data fetch");
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      console.log("useForecast: Simulating API call delay");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate mock data based on selections
      const periods = mockTimePeriods.filter(period => timePeriodIds.includes(period.id));
      console.log("useForecast: Filtered periods:", periods);

      // Base value depends on the number of selected hierarchies to simulate different values
      const baseValue = 10000 * (1 + (hierarchySelections.reduce(
        (acc, curr) => acc + curr.selectedNodes.length, 0
      ) / 10));
      console.log("useForecast: Calculated base value:", baseValue);

      // Create sample inventory items (mimicking the simulation data)
      const inventoryItems = [
        { id: '1', name: 'Item 1' },
        { id: '5', name: 'Item 5' },
        { id: '12', name: 'Item 12' },
        { id: '25', name: 'Item 25' },
        { id: '50', name: 'Item 50' },
        { id: '100', name: 'Item 100' },
        { id: '250', name: 'Item 250' },
        { id: '500', name: 'Item 500' },
      ];

      // Define available filter values (matching FilterSidebar exactly)
      const availableStates = ['CA', 'TX', 'FL', 'NY', 'IL'];
      const availableDMAs = ['ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQR', 'STU', 'VWX', 'YZA', 'BCD',
                             'EFG', 'HIJ', 'KLM', 'NOP', 'QRS', 'TUV', 'WXY', 'ZAB', 'CDE', 'FGH',
                             'IJK', 'LMN', 'OPQ', 'RST', 'UVW', 'XYZ', 'ABD', 'CEF', 'GHK', 'LMQ'];
      const availableDCs = Array.from({ length: 60 }, (_, i) => String(i + 1));

      // Generate baseline data for each inventory item with state/DMA/DC combinations
      const allBaselineData: ForecastDataPoint[] = [];

      inventoryItems.forEach(item => {
        availableStates.forEach((state, stateIndex) => {
          // Use 2-3 DMAs per state for manageable data size
          const stateSpecificDMAs = availableDMAs.slice(stateIndex * 3, (stateIndex + 1) * 3);

          stateSpecificDMAs.forEach((dmaId, dmaIndex) => {
            // Use 2 DCs per DMA for manageable data size
            const dmaSpecificDCs = availableDCs.slice(dmaIndex * 2, (dmaIndex + 1) * 2);

            dmaSpecificDCs.forEach(dcId => {
              // Different base values for different combinations
              const itemBaseValue = baseValue * (0.5 + Math.random() * 1.5);

              periods.forEach((period, index) => {
                // Simulate seasonal trends (slight increase over time)
                const seasonalTrend = 1 + (index * 0.001); // Very gradual increase

                // Add weekly patterns (higher on weekends)
                const date = new Date(period.startDate);
                const dayOfWeek = date.getDay();
                const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.15 : 1.0;

                // Add realistic daily variation
                const randomFactor = 0.85 + (Math.random() * 0.3);

                allBaselineData.push({
                  periodId: period.id,
                  value: Math.round(itemBaseValue * seasonalTrend * weekendBoost * randomFactor),
                  inventoryItemId: item.id,
                  state,
                  dmaId,
                  dcId,
                });
              });
            });
          });
        });
      });

      // Filter baseline data based on filter selections
      const baseline = allBaselineData.filter(dataPoint => {
        // If no filters are selected, include all data
        if (!filterSelections) return true;

        const { states, dmaIds, dcIds } = filterSelections;

        // If no specific filters are active, include all data
        if (states.length === 0 && dmaIds.length === 0 && dcIds.length === 0) {
          return true;
        }

        // Check each filter - if filter is active, data point must match
        const stateMatch = states.length === 0 || states.includes(dataPoint.state || '');
        const dmaMatch = dmaIds.length === 0 || dmaIds.includes(dataPoint.dmaId || '');
        const dcMatch = dcIds.length === 0 || dcIds.includes(dataPoint.dcId || '');

        return stateMatch && dmaMatch && dcMatch;
      });

      console.log("useForecast: Generated baseline data points:", baseline.length);

      // Create the forecast series with inventory items
      const mockForecast: ForecastSeries = {
        id: `forecast-${Date.now()}`,
        hierarchySelections,
        timePeriods: periods,
        baseline,
        inventoryItems,
        lastUpdated: new Date().toISOString(),
      };
      console.log("useForecast: Created mock forecast data", {
        id: mockForecast.id,
        hierarchyCount: mockForecast.hierarchySelections.length,
        periodCount: mockForecast.timePeriods.length,
        dataPointCount: mockForecast.baseline.length
      });

      setForecastData(mockForecast);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      setError('Failed to fetch forecast data. Please try again.');
    } finally {
      console.log("useForecast: Completed fetch, setting isLoading to false");
      setIsLoading(false);
    }
  }, [hierarchySelections, timePeriodIds, mockTimePeriods, filterSelections]);

  // Trigger the fetch operation when inputs change
  useEffect(() => {
    console.log("useForecast effect triggered with:", {
      hierarchySelections,
      timePeriodIds,
      selectionCount: hierarchySelections.length,
      periodCount: timePeriodIds.length
    });

    fetchForecast();
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
          // If we already have adjusted data for this period, use it
          const existingAdjusted = forecastData.adjusted?.find(p => p.periodId === point.periodId);
          return existingAdjusted || { periodId: point.periodId, value: point.value };
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
      }));

      // If we have adjustments, apply them to the new baseline
      let refreshedAdjusted;
      if (forecastData.adjusted) {
        refreshedAdjusted = forecastData.baseline.map((baselinePoint, index) => {
          // Find the corresponding adjusted point
          const originalBaseline = forecastData.baseline.find(
            p => p.periodId === baselinePoint.periodId
          );
          const originalAdjusted = forecastData.adjusted?.find(
            p => p.periodId === baselinePoint.periodId
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
    applyAdjustment,
    resetAdjustments,
    refreshForecast,
  };
}
