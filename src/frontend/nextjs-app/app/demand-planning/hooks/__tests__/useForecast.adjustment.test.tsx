import { renderHook } from '@testing-library/react';
import useForecast from '../useForecast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API service
jest.mock('../../../services/postgresForecastService', () => ({
  postgresForecastService: {
    getDistinctInventoryItems: jest.fn().mockResolvedValue(['item1', 'item2']),
    getForecastDataTimeSeries: jest.fn().mockResolvedValue({
      timeSeries: [
        {
          business_date: '2025-01-01',
          inventory_item_id: 'item1',
          state: 'CA',
          dma_id: 'dma1',
          dc_id: 'dc1',
          y_05: 100,
          y_50: 120,
          y_95: 140,
          // With saved adjustments
          original_y_05: 100,
          original_y_50: 120,
          original_y_95: 140,
          adjusted_y_50: 132, // 10% increase
          total_adjustment_percent: 10,
          adjustment_count: 1
        },
        {
          business_date: '2025-01-02',
          inventory_item_id: 'item1',
          state: 'CA',
          dma_id: 'dma1',
          dc_id: 'dc1',
          y_05: 110,
          y_50: 130,
          y_95: 150,
          // No adjustments
          original_y_05: undefined,
          original_y_50: undefined,
          original_y_95: undefined,
          adjusted_y_50: undefined,
          total_adjustment_percent: 0,
          adjustment_count: 0
        }
      ]
    })
  }
}));

// Mock the query hook
jest.mock('../useForecastQuery', () => ({
  useForecastData: jest.fn().mockReturnValue({
    data: {
      timeSeries: [
        {
          business_date: '2025-01-01',
          inventory_item_id: 'item1',
          state: 'CA',
          dma_id: 'dma1',
          dc_id: 'dc1',
          y_05: 100,
          y_50: 120,
          y_95: 140,
          original_y_05: 100,
          original_y_50: 120,
          original_y_95: 140,
          adjusted_y_50: 132,
          total_adjustment_percent: 10,
          adjustment_count: 1
        },
        {
          business_date: '2025-01-02',
          inventory_item_id: 'item1',
          state: 'CA',
          dma_id: 'dma1',
          dc_id: 'dc1',
          y_05: 110,
          y_50: 130,
          y_95: 150,
          original_y_05: undefined,
          original_y_50: undefined,
          original_y_95: undefined,
          adjusted_y_50: undefined,
          total_adjustment_percent: 0,
          adjustment_count: 0
        }
      ]
    },
    isLoading: false,
    error: null,
    refetch: jest.fn()
  })
}));

describe('useForecast - Adjustment Persistence', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
  };

  it('should properly transform data with saved adjustments', () => {
    const { result } = renderHook(
      () => useForecast({
        filterSelections: {
          states: ['CA'],
          dmaIds: ['dma1'],
          dcIds: ['dc1'],
          inventoryItemId: 'item1',
          dateRange: { startDate: '2025-01-01', endDate: '2025-01-02' }
        }
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.forecastData).toBeDefined();

    const forecastData = result.current.forecastData!;

    // Check that data points are properly transformed
    expect(forecastData.baseline).toHaveLength(2);

    // First data point should have adjustment data
    const firstPoint = forecastData.baseline[0];
    expect(firstPoint.hasAdjustment).toBe(true);
    expect(firstPoint.value).toBe(132); // Should use adjusted value
    expect(firstPoint.original_y_50).toBe(120);
    expect(firstPoint.adjusted_y_50).toBe(132);
    expect(firstPoint.total_adjustment_percent).toBe(10);

    // Second data point should not have adjustments
    const secondPoint = forecastData.baseline[1];
    expect(secondPoint.hasAdjustment).toBe(false);
    expect(secondPoint.value).toBe(130); // Should use original value
    expect(secondPoint.original_y_50).toBeUndefined();
  });

  it('should use adjusted value as display value when adjustments exist', () => {
    const { result } = renderHook(
      () => useForecast({
        filterSelections: {
          states: ['CA'],
          dmaIds: ['dma1'],
          dcIds: ['dc1'],
          inventoryItemId: 'item1',
          dateRange: { startDate: '2025-01-01', endDate: '2025-01-02' }
        }
      }),
      { wrapper: createWrapper() }
    );

    const forecastData = result.current.forecastData!;
    const adjustedPoint = forecastData.baseline.find(p => p.hasAdjustment);

    expect(adjustedPoint).toBeDefined();
    expect(adjustedPoint!.value).toBe(132); // Adjusted value
    expect(adjustedPoint!.y_50).toBe(120); // Original y_50 preserved
  });
});
