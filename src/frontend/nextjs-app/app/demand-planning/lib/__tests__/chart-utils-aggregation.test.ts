import { createChartDataset } from '../chart-utils';
import { ForecastDataPoint, TimePeriod } from '@/app/types/demand-planning';

describe('Chart Utils - Aggregated Data Handling', () => {
  const mockTimePeriods: TimePeriod[] = [
    {
      id: 'day-2025-01-01',
      name: 'Jan 1',
      startDate: '2025-01-01',
      endDate: '2025-01-01',
      type: 'day'
    },
    {
      id: 'day-2025-01-02',
      name: 'Jan 2',
      startDate: '2025-01-02',
      endDate: '2025-01-02',
      type: 'day'
    }
  ];

  it('should skip client-side aggregation for pre-aggregated data', () => {
    const preAggregatedData: ForecastDataPoint[] = [
      {
        periodId: 'day-2025-01-01',
        value: 1000,
        y_50: 1000,
        aggregation_level: 'daily',
        record_count: 50
      },
      {
        periodId: 'day-2025-01-02',
        value: 1200,
        y_50: 1200,
        aggregation_level: 'daily',
        record_count: 50
      }
    ];

    const result = createChartDataset(preAggregatedData, mockTimePeriods);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(1000);
    expect(result[1].value).toBe(1200);
  });

  it('should perform client-side aggregation for non-aggregated data', () => {
    const rawData: ForecastDataPoint[] = [
      {
        periodId: 'day-2025-01-01',
        value: 100,
        y_50: 100
      },
      {
        periodId: 'day-2025-01-01',
        value: 200,
        y_50: 200
      },
      {
        periodId: 'day-2025-01-02',
        value: 300,
        y_50: 300
      }
    ];

    const result = createChartDataset(rawData, mockTimePeriods);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(300); // 100 + 200
    expect(result[0].y_50).toBe(300); // 100 + 200
    expect(result[1].value).toBe(300);
  });

  it('should handle mixed aggregation levels gracefully', () => {
    const mixedData: ForecastDataPoint[] = [
      {
        periodId: 'day-2025-01-01',
        value: 1000,
        aggregation_level: 'weekly',
        record_count: 350
      }
    ];

    const result = createChartDataset(mixedData, mockTimePeriods);

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(1000);
  });

  it('should preserve adjustment data in aggregated results', () => {
    const dataWithAdjustments: ForecastDataPoint[] = [
      {
        periodId: 'day-2025-01-01',
        value: 1000,
        y_50: 1000,
        original_y_50: 900,
        adjusted_y_50: 1000,
        hasAdjustment: true,
        aggregation_level: 'daily'
      }
    ];

    const result = createChartDataset(dataWithAdjustments, mockTimePeriods);

    expect(result[0].original_y_50).toBe(900);
    expect(result[0].adjusted_y_50).toBe(1000);
    expect(result[0].hasAdjustment).toBe(true);
  });
});
