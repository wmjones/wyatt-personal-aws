export type AggregationLevel = 'none' | 'daily' | 'weekly' | 'monthly';

/**
 * Determine the appropriate aggregation level based on date range
 */
export function determineAggregationLevel(startDate: string, endDate: string): AggregationLevel {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 31) return 'daily';
  if (daysDiff <= 90) return 'weekly';
  return 'monthly';
}
