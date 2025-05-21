'use client';

import { useState, useEffect } from 'react';
import {
  ForecastSeries,
  ForecastDataPoint,
  TimePeriod,
  HierarchySelection
} from '@/app/types/demand-planning';
import { createAdjustment } from '../services/adjustmentService';
import { AdjustmentData } from '../components/AdjustmentModal';

interface UseForecastProps {
  hierarchySelections: HierarchySelection[];
  timePeriodIds: string[];
}

export default function useForecast({ hierarchySelections, timePeriodIds }: UseForecastProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastSeries | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock time periods
  const mockTimePeriods: TimePeriod[] = [
    { id: 'Q1-2025', name: 'Q1 2025', startDate: '2025-01-01', endDate: '2025-03-31', type: 'quarter' },
    { id: 'Q2-2025', name: 'Q2 2025', startDate: '2025-04-01', endDate: '2025-06-30', type: 'quarter' },
    { id: 'Q3-2025', name: 'Q3 2025', startDate: '2025-07-01', endDate: '2025-09-30', type: 'quarter' },
    { id: 'Q4-2025', name: 'Q4 2025', startDate: '2025-10-01', endDate: '2025-12-31', type: 'quarter' },
  ];

  // Fetch forecast data based on selections
  useEffect(() => {
    // Skip if no selections are made
    if (hierarchySelections.length === 0 || timePeriodIds.length === 0) {
      setForecastData(null);
      return;
    }

    const fetchForecast = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate mock data based on selections
        const periods = mockTimePeriods.filter(period => timePeriodIds.includes(period.id));

        // Base value depends on the number of selected hierarchies to simulate different values
        const baseValue = 10000 * (1 + (hierarchySelections.reduce(
          (acc, curr) => acc + curr.selectedNodes.length, 0
        ) / 10));

        // Generate random baseline data
        const baseline: ForecastDataPoint[] = periods.map((period, index) => {
          // Simulate growth over time
          const growth = 1 + (index * 0.05);
          // Add some randomness
          const randomFactor = 0.9 + (Math.random() * 0.2);

          return {
            periodId: period.id,
            value: Math.round(baseValue * growth * randomFactor),
          };
        });

        // Create the forecast series without adjustments initially
        const mockForecast: ForecastSeries = {
          id: `forecast-${Date.now()}`,
          hierarchySelections,
          timePeriods: periods,
          baseline,
          lastUpdated: new Date().toISOString(),
        };

        setForecastData(mockForecast);
      } catch (error) {
        console.error('Error fetching forecast data:', error);
        setError('Failed to fetch forecast data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecast();
  }, [hierarchySelections, timePeriodIds, mockTimePeriods]);

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
