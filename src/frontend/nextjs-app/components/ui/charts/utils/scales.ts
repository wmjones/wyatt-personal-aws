import * as d3 from 'd3';
import { ScaleConfig, ChartDataPoint, TimeSeriesDataPoint } from '../types';

/**
 * Scale Utilities
 *
 * Helper functions for creating and configuring D3 scales.
 */

// Type for D3 scales - using any for flexibility with D3's complex type system
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D3Scale = any;

/**
 * Creates a scale based on configuration
 */
export function createScale(config: ScaleConfig): D3Scale {
  const { type, domain, range, padding, nice, clamp } = config;

  let scale: D3Scale;

  switch (type) {
    case 'linear':
      scale = d3.scaleLinear();
      break;
    case 'time':
      scale = d3.scaleTime();
      break;
    case 'band':
      scale = d3.scaleBand();
      if (padding !== undefined) {
        scale.padding(padding);
      }
      break;
    case 'point':
      scale = d3.scalePoint();
      if (padding !== undefined) {
        scale.padding(padding);
      }
      break;
    case 'log':
      scale = d3.scaleLog();
      break;
    case 'pow':
      scale = d3.scalePow();
      break;
    case 'sqrt':
      scale = d3.scaleSqrt();
      break;
    default:
      throw new Error(`Unknown scale type: ${type}`);
  }

  if (domain) {
    scale.domain(domain);
  }

  if (range) {
    scale.range(range);
  }

  if (nice && scale.nice) {
    scale.nice();
  }

  if (clamp && scale.clamp) {
    scale.clamp(clamp);
  }

  return scale;
}

/**
 * Gets the domain for x-axis from data
 */
export function getXDomain(
  data: ChartDataPoint[],
  type: 'linear' | 'time' | 'band' = 'linear',
  padding = 0
): number[] | Date[] | string[] {
  if (data.length === 0) return [0, 1];

  const values = data.map(d => d.x);

  if (type === 'band') {
    return values as string[];
  }

  if (type === 'time') {
    const dateValues = values as Date[];
    const extent = d3.extent(dateValues) as [Date, Date];
    return extent;
  }

  // Linear scale
  const numericValues = values as number[];
  const extent = d3.extent(numericValues) as [number, number];

  // Add padding for linear scales
  if (padding > 0) {
    const range = extent[1] - extent[0];
    return [
      extent[0] - range * padding,
      extent[1] + range * padding
    ];
  }

  return extent;
}

/**
 * Gets the domain for y-axis from data
 */
export function getYDomain(
  data: ChartDataPoint[] | TimeSeriesDataPoint[],
  includeZero = true,
  padding = 0.1
): [number, number] {
  if (data.length === 0) return [0, 1];

  // Get all y values including confidence intervals if present
  const values: number[] = [];

  data.forEach((d: ChartDataPoint | TimeSeriesDataPoint) => {
    values.push(d.y);
    if ('y_lower' in d && d.y_lower !== undefined) {
      values.push(d.y_lower);
    }
    if ('y_upper' in d && d.y_upper !== undefined) {
      values.push(d.y_upper);
    }
  });

  let [min, max] = d3.extent(values) as [number, number];

  // Include zero if requested
  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  // Add padding
  const range = max - min;
  return [
    min - range * padding,
    max + range * padding
  ];
}

/**
 * Creates a time scale with nice defaults
 */
export function createTimeScale(
  domain: [Date, Date],
  range: [number, number]
): d3.ScaleTime<number, number> {
  return d3.scaleTime()
    .domain(domain)
    .range(range)
    .nice();
}

/**
 * Creates a linear scale with nice defaults
 */
export function createLinearScale(
  domain: [number, number],
  range: [number, number],
  nice = true
): d3.ScaleLinear<number, number> {
  const scale = d3.scaleLinear()
    .domain(domain)
    .range(range);

  if (nice) {
    scale.nice();
  }

  return scale;
}

/**
 * Creates a band scale for bar charts
 */
export function createBandScale(
  domain: string[],
  range: [number, number],
  padding = 0.1
): d3.ScaleBand<string> {
  return d3.scaleBand()
    .domain(domain)
    .range(range)
    .padding(padding);
}

/**
 * Creates a color scale
 */
export function createColorScale(
  domain: string[],
  colors?: string[]
): d3.ScaleOrdinal<string, string> {
  const defaultColors = [
    'var(--dp-chart-actual)',
    'var(--dp-chart-forecasted)',
    'var(--dp-chart-edited)',
    'var(--dp-chart-actual-2024)',
    'var(--dp-chart-actual-2023)',
  ];

  return d3.scaleOrdinal<string, string>()
    .domain(domain)
    .range(colors || defaultColors);
}

/**
 * Gets nice tick values for a scale
 */
export function getNiceTicks(
  scale: D3Scale,
  count = 5
): (number | Date | string)[] {
  if ('ticks' in scale && typeof scale.ticks === 'function') {
    return scale.ticks(count);
  }

  if ('domain' in scale && typeof scale.domain === 'function') {
    return scale.domain();
  }

  return [];
}

/**
 * Formats axis tick values
 */
export function getTickFormatter(
  type: 'number' | 'currency' | 'percent' | 'date' | 'month' | 'year',
  customFormat?: (value: number | Date | string) => string
): (value: number | Date | string) => string {
  if (customFormat) return customFormat;

  switch (type) {
    case 'number':
      return (value: number | Date | string) => typeof value === 'number' ? value.toLocaleString() : String(value);

    case 'currency':
      return (value: number | Date | string) => typeof value === 'number' ? `$${value.toLocaleString()}` : String(value);

    case 'percent':
      return (value: number | Date | string) => typeof value === 'number' ? `${(value * 100).toFixed(0)}%` : String(value);

    case 'date':
      return (value: number | Date | string) => value instanceof Date ? d3.timeFormat('%b %d')(value) : String(value);

    case 'month':
      return (value: number | Date | string) => value instanceof Date ? d3.timeFormat('%b %Y')(value) : String(value);

    case 'year':
      return (value: number | Date | string) => value instanceof Date ? d3.timeFormat('%Y')(value) : String(value);

    default:
      return String;
  }
}
