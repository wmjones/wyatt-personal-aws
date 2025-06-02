/**
 * Utility functions for D3 charts
 */

import * as d3 from 'd3';
import { ForecastDataPoint, TimePeriod } from '@/app/types/demand-planning';

/**
 * Formats a number with appropriate suffixes (K, M, B) and currency symbol
 */
export function formatNumber(value: number, includeCurrency: boolean = false): string {
  const prefix = includeCurrency ? '$' : '';

  if (value >= 1000000000) {
    return `${prefix}${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${prefix}${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${prefix}${(value / 1000).toFixed(0)}k`;
  }
  return `${prefix}${value.toFixed(0)}`;
}

/**
 * Formats a date based on the time period type
 */
export function formatDate(date: Date, periodType: TimePeriod['type']): string {
  switch (periodType) {
    case 'day':
      return d3.timeFormat('%b %d')(date);
    case 'week':
      return d3.timeFormat('Week %V, %Y')(date);
    case 'month':
      return d3.timeFormat('%b %Y')(date);
    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    case 'year':
      return d3.timeFormat('%Y')(date);
    default:
      return d3.timeFormat('%b %d, %Y')(date);
  }
}

/**
 * Gets a date from a time period ID (assuming format like "day-2025-01-01", "Q1-2025" or "2025-01")
 */
export function getDateFromPeriodId(periodId: string): Date {
  // Handle day format (e.g., "day-2025-01-01")
  if (periodId.startsWith('day-')) {
    const dateStr = periodId.replace('day-', '');
    return new Date(dateStr);
  }

  // Handle quarter format (e.g., "Q1-2025")
  if (periodId.startsWith('Q')) {
    const [quarter, year] = periodId.replace('Q', '').split('-');
    const month = (parseInt(quarter) - 1) * 3;
    return new Date(parseInt(year), month, 1);
  }

  // Handle year-month format (e.g., "2025-01")
  if (periodId.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = periodId.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  }

  // Handle full date format (e.g., "2025-01-01")
  if (periodId.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(periodId);
  }

  // Default case - return epoch date instead of current date to avoid confusion
  console.warn(`Unknown period ID format: ${periodId}`);
  return new Date(0);
}

/**
 * Creates dataset for charts from forecast data points
 * Aggregates multiple data points for the same period (e.g., after filtering)
 * Optimized for performance with large datasets
 */
export function createChartDataset(
  dataPoints: ForecastDataPoint[],
  timePeriods: TimePeriod[]
): { date: Date; value: number; periodId: string; y_05?: number; y_50?: number; y_95?: number }[] {
  // Early return for empty data
  if (!dataPoints || dataPoints.length === 0) {
    return [];
  }

  // Create a Map for O(1) period lookup instead of O(n) find
  const periodMap = new Map<string, TimePeriod>();
  timePeriods.forEach(period => {
    periodMap.set(period.id, period);
  });

  // Group data points by period ID and sum their values
  const aggregatedData = dataPoints.reduce((acc, point) => {
    if (!acc[point.periodId]) {
      acc[point.periodId] = {
        periodId: point.periodId,
        totalValue: 0,
        count: 0,
        totalY05: 0,
        totalY50: 0,
        totalY95: 0
      };
    }
    acc[point.periodId].totalValue += point.value;
    acc[point.periodId].count += 1;
    // Aggregate confidence intervals if available
    if (point.y_05 !== undefined) acc[point.periodId].totalY05 += point.y_05;
    if (point.y_50 !== undefined) acc[point.periodId].totalY50 += point.y_50;
    if (point.y_95 !== undefined) acc[point.periodId].totalY95 += point.y_95;
    return acc;
  }, {} as Record<string, { periodId: string; totalValue: number; count: number; totalY05: number; totalY50: number; totalY95: number }>);

  // Convert to chart data format
  const chartData = Object.values(aggregatedData).map(({ periodId, totalValue, totalY05, totalY50, totalY95, count }) => {
    const period = periodMap.get(periodId);
    let date: Date;

    if (period) {
      // For day periods, use the startDate directly
      if (period.type === 'day') {
        date = new Date(period.startDate);
      } else {
        // For other period types, use midpoint
        date = new Date((new Date(period.startDate).getTime() + new Date(period.endDate).getTime()) / 2);
      }
    } else {
      // Fallback to parsing from periodId
      date = getDateFromPeriodId(periodId);
    }

    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date for periodId: ${periodId}, using current date as fallback`);
      date = new Date();
    }

    return {
      date,
      value: totalValue, // Use aggregated total value
      periodId,
      // Include aggregated confidence intervals if available
      y_05: count > 0 && totalY05 > 0 ? totalY05 : undefined,
      y_50: count > 0 && totalY50 > 0 ? totalY50 : undefined,
      y_95: count > 0 && totalY95 > 0 ? totalY95 : undefined
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Debug logging
  console.log(`createChartDataset: Created ${chartData.length} data points from ${dataPoints.length} input points`);
  if (chartData.length > 0) {
    console.log(`Date range: ${chartData[0].date.toISOString()} to ${chartData[chartData.length - 1].date.toISOString()}`);
  }

  return chartData;
}

/**
 * Calculates the percentage change between two values
 */
export function calculatePercentageChange(baseline: number, adjusted: number): number {
  if (baseline === 0) return 0;
  return ((adjusted - baseline) / baseline) * 100;
}

/**
 * Get color for positive/negative/neutral values
 */
export function getChangeColor(change: number): string {
  if (change > 0) return 'var(--dp-ui-positive)';
  if (change < 0) return 'var(--dp-ui-negative)';
  return 'var(--dp-ui-neutral)';
}

/**
 * Generate a tooltip for data point
 */
export function generateTooltipContent(
  d: { date: Date; value: number; periodId: string },
  periodType: TimePeriod['type'],
  comparisonValue?: number
): string {
  const dateStr = formatDate(d.date, periodType);
  const valueStr = formatNumber(d.value);

  let content = `
    <div class="p-2">
      <div class="text-xs font-medium">${dateStr}</div>
      <div class="text-sm">${valueStr}</div>
  `;

  if (comparisonValue !== undefined) {
    const change = calculatePercentageChange(comparisonValue, d.value);
    const changeColor = getChangeColor(change);
    const changeStr = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;

    content += `
      <div class="text-xs mt-1" style="color: ${changeColor}">
        ${changeStr} vs baseline
      </div>
    `;
  }

  content += `</div>`;

  return content;
}
