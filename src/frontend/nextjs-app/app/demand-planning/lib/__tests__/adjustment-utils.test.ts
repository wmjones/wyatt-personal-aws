import { describe, it, expect } from '@jest/globals';
import {
  formatFilterContext,
  applyAdjustmentToForecast,
  calculateAdjustmentImpact
} from '../adjustment-utils';

describe('Adjustment Utils', () => {
  describe('formatFilterContext', () => {
    it('should format single state selection', () => {
      const filterContext = {
        states: ['TX'],
        dmaIds: [],
        dcIds: [],
        inventoryItemId: null,
        dateRange: { startDate: null, endDate: null }
      };
      const result = formatFilterContext(filterContext, 'Test Item');
      expect(result).toBe('Test Item • 1 state');
    });

    it('should format multiple states selection', () => {
      const filterContext = {
        states: ['TX', 'CA', 'NY'],
        dmaIds: [],
        dcIds: [],
        inventoryItemId: null,
        dateRange: { startDate: null, endDate: null }
      };
      const result = formatFilterContext(filterContext);
      expect(result).toBe('3 states');
    });

    it('should format complex filter with all selections', () => {
      const filterContext = {
        states: ['TX', 'CA'],
        dmaIds: ['100', '200', '300'],
        dcIds: ['dc1'],
        inventoryItemId: 'item1',
        dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' }
      };
      const result = formatFilterContext(filterContext, 'Product A');
      expect(result).toBe('Product A • 2 states • 3 DMAs • 1 DC');
    });

    it('should handle empty filter context', () => {
      const filterContext = {
        states: [],
        dmaIds: [],
        dcIds: [],
        inventoryItemId: null,
        dateRange: { startDate: null, endDate: null }
      };
      const result = formatFilterContext(filterContext);
      expect(result).toBe('');
    });

    it('should handle null/undefined values', () => {
      const filterContext = {
        states: [],
        dmaIds: [],
        dcIds: [],
        inventoryItemId: null,
        dateRange: { startDate: null, endDate: null }
      };
      const result = formatFilterContext(filterContext);
      expect(result).toBe('');
    });
  });

  describe('applyAdjustmentToForecast', () => {
    it('should apply positive adjustment correctly', () => {
      const result = applyAdjustmentToForecast(100, 5);
      expect(result).toBe(105);
    });

    it('should apply negative adjustment correctly', () => {
      const result = applyAdjustmentToForecast(100, -10);
      expect(result).toBe(90);
    });

    it('should handle zero adjustment', () => {
      const result = applyAdjustmentToForecast(100, 0);
      expect(result).toBe(100);
    });

    it('should handle decimal adjustments', () => {
      const result = applyAdjustmentToForecast(100, 2.5);
      expect(result).toBeCloseTo(102.5, 2);
    });

    it('should handle large values', () => {
      const result = applyAdjustmentToForecast(1000000, 15);
      expect(result).toBe(1150000);
    });
  });

  describe('calculateAdjustmentImpact', () => {
    it('should calculate impact for positive adjustment', () => {
      const result = calculateAdjustmentImpact(1000, 10);

      expect(result.beforeTotal).toBe(1000);
      expect(result.afterTotal).toBe(1100);
      expect(result.absoluteChange).toBe(100);
      expect(result.percentageChange).toBeCloseTo(10, 2);
    });

    it('should calculate impact for negative adjustment', () => {
      const result = calculateAdjustmentImpact(1000, -20);

      expect(result.beforeTotal).toBe(1000);
      expect(result.afterTotal).toBe(800);
      expect(result.absoluteChange).toBe(-200);
      expect(result.percentageChange).toBeCloseTo(-20, 2);
    });

    it('should handle decimal percentages', () => {
      const result = calculateAdjustmentImpact(100, 2.5);

      expect(result.beforeTotal).toBe(100);
      expect(result.afterTotal).toBeCloseTo(102.5, 2);
      expect(result.absoluteChange).toBeCloseTo(2.5, 2);
      expect(result.percentageChange).toBeCloseTo(2.5, 2);
    });

    it('should handle zero baseline', () => {
      const result = calculateAdjustmentImpact(0, 10);

      expect(result.beforeTotal).toBe(0);
      expect(result.afterTotal).toBe(0);
      expect(result.absoluteChange).toBe(0);
      expect(result.percentageChange).toBe(0); // Should be 0, not NaN due to our fix
    });
  });
});
