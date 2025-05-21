/**
 * Utility functions for D3 charts
 */

import * as d3 from 'd3';
import { ForecastDataPoint, TimePeriod } from '@/app/types/demand-planning';

/**
 * Formats a number with appropriate suffixes (K, M, B)
 */
export function formatNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
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
 * Gets a date from a time period ID (assuming format like "Q1-2025" or "2025-01")
 */
export function getDateFromPeriodId(periodId: string): Date {
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

  // Default case
  return new Date();
}

/**
 * Creates dataset for charts from forecast data points
 */
export function createChartDataset(
  dataPoints: ForecastDataPoint[],
  timePeriods: TimePeriod[]
): { date: Date; value: number; periodId: string }[] {
  return dataPoints.map(point => {
    const period = timePeriods.find(p => p.id === point.periodId);
    const date = period
      ? new Date((new Date(period.startDate).getTime() + new Date(period.endDate).getTime()) / 2)
      : getDateFromPeriodId(point.periodId);

    return {
      date,
      value: point.value,
      periodId: point.periodId
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
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
