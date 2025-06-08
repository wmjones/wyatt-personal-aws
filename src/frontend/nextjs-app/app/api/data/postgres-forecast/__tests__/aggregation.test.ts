import { determineAggregationLevel } from '../aggregation-utils';

describe('Aggregation Level Determination', () => {
  it('should return daily for date ranges <= 31 days', () => {
    expect(determineAggregationLevel('2025-01-01', '2025-01-15')).toBe('daily');
    expect(determineAggregationLevel('2025-01-01', '2025-01-31')).toBe('daily');
  });

  it('should return weekly for date ranges 32-90 days', () => {
    expect(determineAggregationLevel('2025-01-01', '2025-02-05')).toBe('weekly');
    expect(determineAggregationLevel('2025-01-01', '2025-03-15')).toBe('weekly');
  });

  it('should return monthly for date ranges > 90 days', () => {
    expect(determineAggregationLevel('2025-01-01', '2025-04-15')).toBe('monthly');
    expect(determineAggregationLevel('2025-01-01', '2025-12-31')).toBe('monthly');
  });

  it('should handle edge cases correctly', () => {
    // Exactly 30 days (Jan has 31 days, so Jan 1 to Jan 31 = 30 days)
    expect(determineAggregationLevel('2025-01-01', '2025-01-31')).toBe('daily');
    // Exactly 31 days (Jan 1 to Feb 1 = 31 days)
    expect(determineAggregationLevel('2025-01-01', '2025-02-01')).toBe('daily');
    // Exactly 32 days
    expect(determineAggregationLevel('2025-01-01', '2025-02-02')).toBe('weekly');
    // Exactly 89 days (Jan 1 to Mar 31 = 89 days)
    expect(determineAggregationLevel('2025-01-01', '2025-03-31')).toBe('weekly');
    // Exactly 90 days
    expect(determineAggregationLevel('2025-01-01', '2025-04-01')).toBe('weekly');
    // Exactly 91 days
    expect(determineAggregationLevel('2025-01-01', '2025-04-02')).toBe('monthly');
  });
});
