import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { chartConfig } from '../config';

// Type for D3 scales that support axis
type AxisScale = d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> | d3.ScaleBand<string>;

interface ChartAxisProps {
  type: 'x' | 'y';
  scale: AxisScale;
  transform?: string;
  label?: string;
  tickFormat?: (value: number | Date | string) => string;
  tickCount?: number;
  tickValues?: (number | Date | string)[];
  tickSize?: number;
  tickPadding?: number;
  labelOffset?: number;
  className?: string;
  gridLines?: boolean;
  gridLineLength?: number;
}

/**
 * ChartAxis Component
 *
 * A reusable D3 axis component that handles both x and y axes
 * with consistent styling and configuration.
 *
 * @example
 * <ChartAxis
 *   type="x"
 *   scale={xScale}
 *   transform={`translate(0, ${innerHeight})`}
 *   label="Date"
 *   tickFormat={d3.timeFormat('%b %d')}
 * />
 */
export const ChartAxis: React.FC<ChartAxisProps> = ({
  type,
  scale,
  transform,
  label,
  tickFormat,
  tickCount,
  tickValues,
  tickSize = chartConfig.axis[type].tickSize,
  tickPadding = chartConfig.axis[type].tickPadding,
  labelOffset = 40,
  className = '',
  gridLines = false,
  gridLineLength = 0,
}) => {
  const axisRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!axisRef.current || !scale) return;

    // Create axis generator - using any due to D3's complex type system
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axisGenerator: any = type === 'x'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? d3.axisBottom(scale as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : d3.axisLeft(scale as any);

    // Configure axis
    axisGenerator
      .tickSize(gridLines ? -gridLineLength : tickSize)
      .tickPadding(tickPadding);

    if (tickFormat) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      axisGenerator.tickFormat((d: any) => tickFormat(d as number | Date | string));
    }

    if (tickCount !== undefined && 'ticks' in axisGenerator) {
      axisGenerator.ticks(tickCount);
    }

    if (tickValues && 'tickValues' in axisGenerator) {
      axisGenerator.tickValues(tickValues as d3.AxisDomain[]);
    }

    // Render axis
    const axis = d3.select(axisRef.current);
    axis.call(axisGenerator);

    // Apply styling
    axis.selectAll('.domain')
      .style('stroke', 'var(--dp-chart-grid)')
      .style('stroke-width', '1px');

    axis.selectAll('.tick line')
      .style('stroke', 'var(--dp-chart-grid)')
      .style('stroke-width', '1px')
      .style('stroke-dasharray', gridLines ? chartConfig.grid.strokeDasharray : 'none')
      .style('opacity', gridLines ? chartConfig.grid.opacity : 1);

    axis.selectAll('.tick text')
      .style('fill', 'var(--dp-chart-axis-text)')
      .style('font-size', '12px')
      .style('font-family', 'var(--font-sans)');

    // Rotate x-axis labels if needed
    if (type === 'x' && chartConfig.axis.x.labelRotation) {
      axis.selectAll('.tick text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', `rotate(${chartConfig.axis.x.labelRotation})`);
    }

    // Clean up any previous label
    axis.select('.axis-label').remove();

    // Add axis label if provided
    if (label) {
      const labelElement = axis.append('text')
        .attr('class', 'axis-label')
        .style('fill', 'var(--dp-chart-axis-text)')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .style('text-anchor', 'middle')
        .text(label);

      if (type === 'x') {
        labelElement
          .attr('x', scale.range()[1] / 2)
          .attr('y', labelOffset);
      } else {
        labelElement
          .attr('transform', 'rotate(-90)')
          .attr('x', -scale.range()[0] / 2)
          .attr('y', -labelOffset);
      }
    }
  }, [type, scale, label, tickFormat, tickCount, tickValues, tickSize, tickPadding, labelOffset, gridLines, gridLineLength]);

  return (
    <g
      ref={axisRef}
      className={`chart-axis chart-axis-${type} ${className}`}
      transform={transform}
    />
  );
};
