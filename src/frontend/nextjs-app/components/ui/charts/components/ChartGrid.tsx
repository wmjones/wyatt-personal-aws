import React from 'react';
import * as d3 from 'd3';
import { chartConfig } from '../config';

// Type for D3 scales
type GridScale = d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> | d3.ScaleBand<string>;

interface ChartGridProps {
  xScale?: GridScale;
  yScale?: GridScale;
  width: number;
  height: number;
  showHorizontal?: boolean;
  showVertical?: boolean;
  strokeDasharray?: string;
  opacity?: number;
  className?: string;
}

/**
 * ChartGrid Component
 *
 * Renders grid lines for charts using D3 scales.
 *
 * @example
 * <ChartGrid
 *   xScale={xScale}
 *   yScale={yScale}
 *   width={innerWidth}
 *   height={innerHeight}
 *   showHorizontal
 * />
 */
export const ChartGrid: React.FC<ChartGridProps> = ({
  xScale,
  yScale,
  width,
  height,
  showHorizontal = chartConfig.grid.showHorizontal,
  showVertical = chartConfig.grid.showVertical,
  strokeDasharray = chartConfig.grid.strokeDasharray,
  opacity = chartConfig.grid.opacity,
  className = '',
}) => {
  const horizontalLines = yScale && showHorizontal && 'ticks' in yScale ? yScale.ticks() : [];
  const verticalLines = xScale && showVertical && 'ticks' in xScale ? xScale.ticks() : [];

  return (
    <g className={`chart-grid ${className}`}>
      {/* Horizontal grid lines */}
      {horizontalLines.map((tick: number | Date, index: number) => (
        <line
          key={`h-grid-${index}`}
          x1={0}
          x2={width}
          y1={yScale!(tick as never)}
          y2={yScale!(tick as never)}
          stroke="var(--dp-chart-grid)"
          strokeDasharray={strokeDasharray}
          opacity={opacity}
        />
      ))}

      {/* Vertical grid lines */}
      {verticalLines.map((tick: number | Date, index: number) => (
        <line
          key={`v-grid-${index}`}
          x1={xScale!(tick as never)}
          x2={xScale!(tick as never)}
          y1={0}
          y2={height}
          stroke="var(--dp-chart-grid)"
          strokeDasharray={strokeDasharray}
          opacity={opacity}
        />
      ))}
    </g>
  );
};
