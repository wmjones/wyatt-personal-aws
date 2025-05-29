import {
  formatNumber,
  formatDate,
  getDateFromPeriodId,
  createChartDataset,
  calculatePercentageChange,
  getChangeColor,
  generateTooltipContent
} from '../chart-utils';
import { ForecastDataPoint, TimePeriod } from '@/app/types/demand-planning';

type PeriodType = TimePeriod['type'];

// Mock console methods
beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('chart-utils', () => {
  describe('formatNumber', () => {
    it('should format billions with B suffix', () => {
      expect(formatNumber(1500000000)).toBe('1.5B');
      expect(formatNumber(2700000000)).toBe('2.7B');
      expect(formatNumber(1000000000)).toBe('1.0B');
    });

    it('should format millions with M suffix', () => {
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(2700000)).toBe('2.7M');
      expect(formatNumber(1000000)).toBe('1.0M');
    });

    it('should format thousands with k suffix', () => {
      expect(formatNumber(1500)).toBe('2k'); // Rounds to 0 decimals
      expect(formatNumber(2700)).toBe('3k');
      expect(formatNumber(1000)).toBe('1k');
      expect(formatNumber(15000)).toBe('15k');
    });

    it('should format small numbers without suffix', () => {
      expect(formatNumber(999)).toBe('999');
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(0)).toBe('0');
    });

    it('should include currency symbol when requested', () => {
      expect(formatNumber(1500000000, true)).toBe('$1.5B');
      expect(formatNumber(1500000, true)).toBe('$1.5M');
      expect(formatNumber(1500, true)).toBe('$2k');
      expect(formatNumber(100, true)).toBe('$100');
    });

    it('should handle negative numbers', () => {
      // Current implementation doesn't format negative numbers with suffixes
      expect(formatNumber(-1500000)).toBe('-1500000');
      expect(formatNumber(-1500, true)).toBe('$-1500');
    });

    it('should handle decimal values', () => {
      expect(formatNumber(1234567.89)).toBe('1.2M');
      expect(formatNumber(12345.67)).toBe('12k');
      expect(formatNumber(123.45)).toBe('123');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-03-15T12:00:00Z');

    it('should format day period as "MMM DD"', () => {
      expect(formatDate(testDate, 'day')).toBe('Mar 15');
    });

    it('should format week period as "Week W, YYYY"', () => {
      expect(formatDate(testDate, 'week')).toBe('Week 11, 2024');
    });

    it('should format month period as "MMM YYYY"', () => {
      expect(formatDate(testDate, 'month')).toBe('Mar 2024');
    });

    it('should format quarter period as "QX YYYY"', () => {
      expect(formatDate(testDate, 'quarter')).toBe('Q1 2024');
      expect(formatDate(new Date('2024-06-15'), 'quarter')).toBe('Q2 2024');
      expect(formatDate(new Date('2024-09-15'), 'quarter')).toBe('Q3 2024');
      expect(formatDate(new Date('2024-12-15'), 'quarter')).toBe('Q4 2024');
    });

    it('should format year period as "YYYY"', () => {
      expect(formatDate(testDate, 'year')).toBe('2024');
    });

    it('should handle unknown period types', () => {
      expect(formatDate(testDate, 'unknown' as PeriodType)).toBe('Mar 15, 2024');
    });

    it('should handle edge dates correctly', () => {
      expect(formatDate(new Date('2024-01-01'), 'day')).toBe('Jan 01');
      expect(formatDate(new Date('2024-12-31'), 'day')).toBe('Dec 31');
    });
  });

  describe('getDateFromPeriodId', () => {
    it('should parse day format (day-YYYY-MM-DD)', () => {
      const date = getDateFromPeriodId('day-2024-03-15');
      expect(date.toISOString()).toBe('2024-03-15T00:00:00.000Z');
    });

    it('should parse quarter format (QX-YYYY)', () => {
      expect(getDateFromPeriodId('Q1-2024').toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(getDateFromPeriodId('Q2-2024').toISOString()).toBe('2024-04-01T00:00:00.000Z');
      expect(getDateFromPeriodId('Q3-2024').toISOString()).toBe('2024-07-01T00:00:00.000Z');
      expect(getDateFromPeriodId('Q4-2024').toISOString()).toBe('2024-10-01T00:00:00.000Z');
    });

    it('should parse year-month format (YYYY-MM)', () => {
      const date = getDateFromPeriodId('2024-03');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2); // March is month 2 (0-indexed)
      expect(date.getDate()).toBe(1);
    });

    it('should parse full date format (YYYY-MM-DD)', () => {
      const date = getDateFromPeriodId('2024-03-15');
      expect(date.toISOString()).toBe('2024-03-15T00:00:00.000Z');
    });

    it('should handle unknown formats by returning epoch date', () => {
      const date = getDateFromPeriodId('invalid-format');
      expect(date.getTime()).toBe(0);
      expect(console.warn).toHaveBeenCalledWith('Unknown period ID format: invalid-format');
    });

    it('should handle edge cases', () => {
      expect(getDateFromPeriodId('day-2024-12-31').getDate()).toBe(31);
      expect(getDateFromPeriodId('2024-02').getMonth()).toBe(1); // February
      expect(getDateFromPeriodId('Q1-2025').getFullYear()).toBe(2025);
    });
  });

  describe('createChartDataset', () => {
    const timePeriods: TimePeriod[] = [
      { id: 'day-2024-01-01', name: 'Jan 1', type: 'day', startDate: '2024-01-01', endDate: '2024-01-01' },
      { id: 'day-2024-01-02', name: 'Jan 2', type: 'day', startDate: '2024-01-02', endDate: '2024-01-02' },
      { id: 'day-2024-01-03', name: 'Jan 3', type: 'day', startDate: '2024-01-03', endDate: '2024-01-03' }
    ];

    it('should return empty array for empty input', () => {
      expect(createChartDataset([], timePeriods)).toEqual([]);
      expect(createChartDataset(null as unknown as ForecastDataPoint[], timePeriods)).toEqual([]);
      expect(createChartDataset(undefined as unknown as ForecastDataPoint[], timePeriods)).toEqual([]);
    });

    it('should create dataset from single data points', () => {
      const dataPoints: ForecastDataPoint[] = [
        { periodId: 'day-2024-01-01', value: 100, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' },
        { periodId: 'day-2024-01-02', value: 150, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' }
      ];

      const result = createChartDataset(dataPoints, timePeriods);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(100);
      expect(result[1].value).toBe(150);
      expect(result[0].periodId).toBe('day-2024-01-01');
      expect(result[1].periodId).toBe('day-2024-01-02');
    });

    it('should aggregate multiple data points for the same period', () => {
      const dataPoints: ForecastDataPoint[] = [
        { periodId: 'day-2024-01-01', value: 100, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' },
        { periodId: 'day-2024-01-01', value: 50, inventoryItemId: '2', state: 'CA', dmaId: 'DMA-1', dcId: '101' },
        { periodId: 'day-2024-01-02', value: 200, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' }
      ];

      const result = createChartDataset(dataPoints, timePeriods);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(150); // 100 + 50
      expect(result[1].value).toBe(200);
    });

    it('should handle confidence intervals', () => {
      const dataPoints: ForecastDataPoint[] = [
        {
          periodId: 'day-2024-01-01',
          value: 100,
          inventoryItemId: '1',
          state: 'CA',
          dmaId: 'DMA-1',
          dcId: '101',
          y_05: 80,
          y_50: 100,
          y_95: 120
        }
      ];

      const result = createChartDataset(dataPoints, timePeriods);

      expect(result[0].y_05).toBe(80);
      expect(result[0].y_50).toBe(100);
      expect(result[0].y_95).toBe(120);
    });

    it('should aggregate confidence intervals', () => {
      const dataPoints: ForecastDataPoint[] = [
        { periodId: 'day-2024-01-01', value: 100, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101', y_05: 80, y_50: 100, y_95: 120 },
        { periodId: 'day-2024-01-01', value: 50, inventoryItemId: '2', state: 'CA', dmaId: 'DMA-1', dcId: '101', y_05: 40, y_50: 50, y_95: 60 }
      ];

      const result = createChartDataset(dataPoints, timePeriods);

      expect(result[0].y_05).toBe(120); // 80 + 40
      expect(result[0].y_50).toBe(150); // 100 + 50
      expect(result[0].y_95).toBe(180); // 120 + 60
    });

    it('should sort data by date', () => {
      const dataPoints: ForecastDataPoint[] = [
        { periodId: 'day-2024-01-03', value: 300, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' },
        { periodId: 'day-2024-01-01', value: 100, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' },
        { periodId: 'day-2024-01-02', value: 200, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' }
      ];

      const result = createChartDataset(dataPoints, timePeriods);

      expect(result[0].periodId).toBe('day-2024-01-01');
      expect(result[1].periodId).toBe('day-2024-01-02');
      expect(result[2].periodId).toBe('day-2024-01-03');
    });

    it('should handle periods not in timePeriods array', () => {
      const dataPoints: ForecastDataPoint[] = [
        { periodId: 'day-2024-01-04', value: 400, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' }
      ];

      const result = createChartDataset(dataPoints, timePeriods);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(400);
      expect(result[0].date).toEqual(new Date('2024-01-04'));
    });

    it('should handle non-day period types', () => {
      const monthPeriods: TimePeriod[] = [
        { id: 'month-2024-01', name: 'Jan 2024', type: 'month', startDate: '2024-01-01', endDate: '2024-01-31' }
      ];

      const dataPoints: ForecastDataPoint[] = [
        { periodId: 'month-2024-01', value: 1000, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' }
      ];

      const result = createChartDataset(dataPoints, monthPeriods);

      expect(result).toHaveLength(1);
      // Should use midpoint of month
      const expectedDate = new Date((new Date('2024-01-01').getTime() + new Date('2024-01-31').getTime()) / 2);
      expect(result[0].date.getTime()).toBe(expectedDate.getTime());
    });

    it('should handle invalid dates gracefully', () => {
      const dataPoints: ForecastDataPoint[] = [
        { periodId: 'invalid-period', value: 100, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' }
      ];

      const result = createChartDataset(dataPoints, []);

      expect(console.warn).toHaveBeenCalledWith('Unknown period ID format: invalid-period');
      // The function returns epoch date (new Date(0)) for invalid formats, which is a valid date
      expect(result).toHaveLength(1);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[0].date.getTime()).toBe(0); // Epoch time
    });

    it('should log debug information', () => {
      const dataPoints: ForecastDataPoint[] = [
        { periodId: 'day-2024-01-01', value: 100, inventoryItemId: '1', state: 'CA', dmaId: 'DMA-1', dcId: '101' }
      ];

      createChartDataset(dataPoints, timePeriods);

      expect(console.log).toHaveBeenCalledWith('createChartDataset: Created 1 data points from 1 input points');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Date range:'));
    });
  });

  describe('calculatePercentageChange', () => {
    it('should calculate positive percentage change', () => {
      expect(calculatePercentageChange(100, 150)).toBe(50);
      expect(calculatePercentageChange(200, 220)).toBe(10);
    });

    it('should calculate negative percentage change', () => {
      expect(calculatePercentageChange(100, 50)).toBe(-50);
      expect(calculatePercentageChange(200, 180)).toBe(-10);
    });

    it('should return 0 when baseline is 0', () => {
      expect(calculatePercentageChange(0, 100)).toBe(0);
      expect(calculatePercentageChange(0, -100)).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(calculatePercentageChange(100, 125.5)).toBe(25.5);
      expect(calculatePercentageChange(50.5, 60.6)).toBeCloseTo(20, 0);
    });

    it('should handle very small changes', () => {
      expect(calculatePercentageChange(1000000, 1000001)).toBeCloseTo(0.0001, 4);
    });
  });

  describe('getChangeColor', () => {
    it('should return positive color for positive changes', () => {
      expect(getChangeColor(10)).toBe('var(--dp-ui-positive)');
      expect(getChangeColor(0.01)).toBe('var(--dp-ui-positive)');
      expect(getChangeColor(100)).toBe('var(--dp-ui-positive)');
    });

    it('should return negative color for negative changes', () => {
      expect(getChangeColor(-10)).toBe('var(--dp-ui-negative)');
      expect(getChangeColor(-0.01)).toBe('var(--dp-ui-negative)');
      expect(getChangeColor(-100)).toBe('var(--dp-ui-negative)');
    });

    it('should return neutral color for zero change', () => {
      expect(getChangeColor(0)).toBe('var(--dp-ui-neutral)');
    });
  });

  describe('generateTooltipContent', () => {
    const dataPoint = {
      date: new Date('2024-01-15'),
      value: 1500000,
      periodId: 'day-2024-01-15'
    };

    it('should generate basic tooltip content', () => {
      const content = generateTooltipContent(dataPoint, 'day');

      expect(content).toContain('Jan 15');
      expect(content).toContain('1.5M');
      expect(content).toContain('<div class="text-xs font-medium">');
      expect(content).toContain('<div class="text-sm">');
    });

    it('should include comparison when provided', () => {
      const content = generateTooltipContent(dataPoint, 'day', 1000000);

      expect(content).toContain('+50.0% vs baseline');
      expect(content).toContain('color: var(--dp-ui-positive)');
    });

    it('should show negative comparison', () => {
      const content = generateTooltipContent(dataPoint, 'day', 2000000);

      expect(content).toContain('-25.0% vs baseline');
      expect(content).toContain('color: var(--dp-ui-negative)');
    });

    it('should show neutral comparison for zero change', () => {
      const content = generateTooltipContent(dataPoint, 'day', 1500000);

      expect(content).toContain('0.0% vs baseline');
      expect(content).toContain('color: var(--dp-ui-neutral)');
    });

    it('should format different period types correctly', () => {
      const monthContent = generateTooltipContent(dataPoint, 'month');
      expect(monthContent).toContain('Jan 2024');

      const yearContent = generateTooltipContent(dataPoint, 'year');
      expect(yearContent).toContain('2024');
    });

    it('should handle small values', () => {
      const smallDataPoint = { ...dataPoint, value: 123 };
      const content = generateTooltipContent(smallDataPoint, 'day');

      expect(content).toContain('123');
    });

    it('should handle zero values', () => {
      const zeroDataPoint = { ...dataPoint, value: 0 };
      const content = generateTooltipContent(zeroDataPoint, 'day');

      expect(content).toContain('0');
    });
  });
});
