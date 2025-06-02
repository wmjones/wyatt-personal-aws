import {
  fetchStateOptions,
  fetchDMAOptions,
  fetchDCOptions,
  fetchInventoryItemOptions,
  fetchRestaurantOptions
} from '../queryFunctions';
import { forecastService } from '../../forecastService';

// Mock the forecast service
jest.mock('../../forecastService');

describe('Dropdown Query Functions', () => {
  const mockForecastService = forecastService as jest.Mocked<typeof forecastService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchStateOptions', () => {
    it('should fetch and transform state options', async () => {
      const mockStates = ['CA', 'TX', 'NY', 'FL'];
      mockForecastService.getDistinctStates.mockResolvedValueOnce(mockStates);

      const result = await fetchStateOptions();

      expect(mockForecastService.getDistinctStates).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { value: 'CA', label: 'CA' },
        { value: 'TX', label: 'TX' },
        { value: 'NY', label: 'NY' },
        { value: 'FL', label: 'FL' },
      ]);
    });

    it('should handle empty state list', async () => {
      mockForecastService.getDistinctStates.mockResolvedValueOnce([]);

      const result = await fetchStateOptions();

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service unavailable');
      mockForecastService.getDistinctStates.mockRejectedValueOnce(error);

      await expect(fetchStateOptions()).rejects.toThrow('Service unavailable');
    });
  });

  describe('fetchDMAOptions', () => {
    it('should fetch and transform DMA options with prefix', async () => {
      const mockDMAs = ['001', '002', '003'];
      mockForecastService.getDistinctDmaIds.mockResolvedValueOnce(mockDMAs);

      const result = await fetchDMAOptions();

      expect(mockForecastService.getDistinctDmaIds).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { value: '001', label: 'DMA 001' },
        { value: '002', label: 'DMA 002' },
        { value: '003', label: 'DMA 003' },
      ]);
    });

    it('should handle special DMA formats', async () => {
      const mockDMAs = ['DMA-001', 'Region-A', '123'];
      mockForecastService.getDistinctDmaIds.mockResolvedValueOnce(mockDMAs);

      const result = await fetchDMAOptions();

      expect(result).toEqual([
        { value: 'DMA-001', label: 'DMA DMA-001' },
        { value: 'Region-A', label: 'DMA Region-A' },
        { value: '123', label: 'DMA 123' },
      ]);
    });
  });

  describe('fetchDCOptions', () => {
    it('should fetch and transform DC options with prefix', async () => {
      const mockDCs = ['101', '102', '103'];
      mockForecastService.getDistinctDcIds.mockResolvedValueOnce(mockDCs);

      const result = await fetchDCOptions();

      expect(mockForecastService.getDistinctDcIds).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { value: '101', label: 'DC 101' },
        { value: '102', label: 'DC 102' },
        { value: '103', label: 'DC 103' },
      ]);
    });

    it('should handle mixed DC formats', async () => {
      const mockDCs = ['DC-West', '999', 'Central-01'];
      mockForecastService.getDistinctDcIds.mockResolvedValueOnce(mockDCs);

      const result = await fetchDCOptions();

      expect(result).toEqual([
        { value: 'DC-West', label: 'DC DC-West' },
        { value: '999', label: 'DC 999' },
        { value: 'Central-01', label: 'DC Central-01' },
      ]);
    });
  });

  describe('fetchInventoryItemOptions', () => {
    it('should fetch and transform inventory item options', async () => {
      const mockItems = ['1', '2', '3', '10', '100'];
      mockForecastService.getDistinctInventoryItems.mockResolvedValueOnce(mockItems);

      const result = await fetchInventoryItemOptions();

      expect(mockForecastService.getDistinctInventoryItems).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { value: '1', label: 'Item 1' },
        { value: '2', label: 'Item 2' },
        { value: '3', label: 'Item 3' },
        { value: '10', label: 'Item 10' },
        { value: '100', label: 'Item 100' },
      ]);
    });

    it('should handle non-string inventory items', async () => {
      // In case the service returns numbers or mixed types
      const mockItems = ['1', '2', '3'] as unknown as string[];
      mockForecastService.getDistinctInventoryItems.mockResolvedValueOnce(mockItems);

      const result = await fetchInventoryItemOptions();

      expect(result).toEqual([
        { value: '1', label: 'Item 1' },
        { value: '2', label: 'Item 2' },
        { value: '3', label: 'Item 3' },
      ]);
    });
  });

  describe('fetchRestaurantOptions', () => {
    it('should fetch and transform restaurant options', async () => {
      const mockRestaurants = ['001', '002', '100'];
      mockForecastService.getDistinctRestaurants.mockResolvedValueOnce(mockRestaurants);

      const result = await fetchRestaurantOptions();

      expect(mockForecastService.getDistinctRestaurants).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { value: '001', label: 'Restaurant 001' },
        { value: '002', label: 'Restaurant 002' },
        { value: '100', label: 'Restaurant 100' },
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined values', async () => {
      // Test with null values in the array
      const mockStates = ['CA', null, 'TX', undefined, ''] as unknown as string[];
      mockForecastService.getDistinctStates.mockResolvedValueOnce(mockStates);

      const result = await fetchStateOptions();

      // The transform function maps over the array as-is
      expect(result).toEqual([
        { value: 'CA', label: 'CA' },
        { value: null, label: null },
        { value: 'TX', label: 'TX' },
        { value: undefined, label: undefined },
        { value: '', label: '' },
      ]);
    });

    it('should handle very long lists efficiently', async () => {
      // Generate a large list
      const mockStates = Array.from({ length: 1000 }, (_, i) => `State${i}`);
      mockForecastService.getDistinctStates.mockResolvedValueOnce(mockStates);

      const startTime = Date.now();
      const result = await fetchStateOptions();
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(result[0]).toEqual({ value: 'State0', label: 'State0' });
      expect(result[999]).toEqual({ value: 'State999', label: 'State999' });

      // Transformation should be fast (less than 100ms for 1000 items)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle special characters in values', async () => {
      const mockStates = ['CA & NV', 'TX/OK', 'NY (Metro)', 'FL - South'];
      mockForecastService.getDistinctStates.mockResolvedValueOnce(mockStates);

      const result = await fetchStateOptions();

      expect(result).toEqual([
        { value: 'CA & NV', label: 'CA & NV' },
        { value: 'TX/OK', label: 'TX/OK' },
        { value: 'NY (Metro)', label: 'NY (Metro)' },
        { value: 'FL - South', label: 'FL - South' },
      ]);
    });
  });

  describe('Future Filter Support', () => {
    // These tests document the expected behavior when server-side filtering is implemented

    it.skip('should pass state filter to DMA query', async () => {
      const mockDMAs = ['DMA001', 'DMA002'];
      mockForecastService.getDistinctDmaIds.mockResolvedValueOnce(mockDMAs);

      const result = await fetchDMAOptions();

      // When implemented, should pass filter to service
      expect(mockForecastService.getDistinctDmaIds).toHaveBeenCalledWith({ stateId: 'CA' });
      expect(result).toEqual([
        { value: 'DMA001', label: 'DMA DMA001' },
        { value: 'DMA002', label: 'DMA DMA002' },
      ]);
    });

    it.skip('should pass state and DMA filters to DC query', async () => {
      const mockDCs = ['101'];
      mockForecastService.getDistinctDcIds.mockResolvedValueOnce(mockDCs);

      const result = await fetchDCOptions();

      // When implemented, should pass filters to service
      expect(mockForecastService.getDistinctDcIds).toHaveBeenCalledWith({
        stateId: 'CA',
        dmaId: 'DMA001'
      });
      expect(result).toEqual([
        { value: '101', label: 'DC 101' },
      ]);
    });
  });
});
