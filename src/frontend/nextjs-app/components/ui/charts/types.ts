/**
 * Chart Types
 *
 * Common TypeScript interfaces and types used across chart components.
 */

import { ReactNode } from 'react';
import * as d3 from 'd3';

// Base data point for all charts
export interface ChartDataPoint {
  x: number | Date | string;
  y: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

// Multi-series data point
export interface MultiSeriesDataPoint extends ChartDataPoint {
  series: string;
}

// Time series specific
export interface TimeSeriesDataPoint extends ChartDataPoint {
  x: Date;
  y_lower?: number; // Confidence interval lower bound
  y_upper?: number; // Confidence interval upper bound
}

// Chart margins
export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Common chart props
export interface BaseChartProps {
  width?: number;
  height?: number;
  margin?: ChartMargin;
  className?: string;
  loading?: boolean;
  error?: string | Error;
  emptyMessage?: string;
  animate?: boolean;
  'data-testid'?: string;
}

// Axis configuration
export interface AxisConfig {
  show?: boolean;
  label?: string;
  tickFormat?: (value: number | Date | string) => string;
  tickCount?: number;
  tickValues?: (number | Date | string)[];
  domain?: [number, number] | [Date, Date];
  nice?: boolean;
}

// Grid configuration
export interface GridConfig {
  showHorizontal?: boolean;
  showVertical?: boolean;
  strokeDasharray?: string;
  opacity?: number;
}

// Tooltip configuration
export interface TooltipConfig {
  show?: boolean;
  format?: (data: ChartDataPoint | TimeSeriesDataPoint) => ReactNode;
  offset?: { x: number; y: number };
}

// Legend configuration
export interface LegendConfig {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom';
  items?: LegendItem[];
}

export interface LegendItem {
  label: string;
  color: string;
  shape?: 'circle' | 'square' | 'line';
  strokeDasharray?: string;
}

// Chart container props
export interface ChartContainerProps extends BaseChartProps {
  children: (dimensions: ChartDimensions) => ReactNode;
  minHeight?: number;
  aspectRatio?: number;
}

// Chart dimensions after accounting for margins
export interface ChartDimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: ChartMargin;
}

// Scale types
export type ScaleType = 'linear' | 'time' | 'band' | 'point' | 'log' | 'pow' | 'sqrt';

// Common scale configuration
export interface ScaleConfig {
  type: ScaleType;
  domain?: (number | Date | string)[];
  range?: (number | string)[];
  padding?: number;
  nice?: boolean;
  clamp?: boolean;
}

// Event handlers
export interface ChartEventHandlers {
  onClick?: (data: ChartDataPoint | TimeSeriesDataPoint, event: React.MouseEvent) => void;
  onHover?: (data: ChartDataPoint | TimeSeriesDataPoint, event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

// Brush configuration
export interface BrushConfig {
  enabled?: boolean;
  height?: number;
  onChange?: (domain: [Date, Date] | [number, number]) => void;
  initialSelection?: [Date, Date] | [number, number];
}

// Zoom configuration
// D3 Zoom Transform type
export interface D3ZoomTransform {
  k: number;
  x: number;
  y: number;
}

export interface ZoomConfig {
  enabled?: boolean;
  scaleExtent?: [number, number];
  translateExtent?: [[number, number], [number, number]];
  onZoom?: (transform: D3ZoomTransform) => void;
}

// Animation configuration
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  stagger?: number;
}

// Chart state for hooks
export interface ChartState {
  tooltip: {
    visible: boolean;
    content: ReactNode;
    position: { x: number; y: number };
  };
  hoveredItem: ChartDataPoint | TimeSeriesDataPoint | null;
  selectedItems: (ChartDataPoint | TimeSeriesDataPoint)[];
  zoomTransform: D3ZoomTransform | null;
  brushSelection: [Date, Date] | [number, number] | null;
}

// D3 Scale type - a union of common D3 scale types
export type D3ScaleAny =
  | d3.ScaleLinear<number, number>
  | d3.ScaleTime<number, number>
  | d3.ScaleBand<string>
  | d3.ScalePoint<string>
  | d3.ScaleOrdinal<string, string>;

// Hook return types
export interface UseChartReturn {
  svgRef: React.RefObject<SVGSVGElement>;
  dimensions: ChartDimensions;
  scales: {
    x: D3ScaleAny;
    y: D3ScaleAny;
  };
  state: ChartState;
  handlers: {
    handleMouseMove: (event: React.MouseEvent) => void;
    handleMouseLeave: () => void;
    handleClick: (data: ChartDataPoint | TimeSeriesDataPoint, event: React.MouseEvent) => void;
  };
}
