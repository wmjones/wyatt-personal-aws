import React, { useEffect, useMemo, useState, useRef } from 'react';
import * as d3 from 'd3';
import { ChartContainer } from './core/ChartContainer';
import { ChartTooltip, tooltipBuilders } from './components/ChartTooltip';
// import { ChartAxis } from './components/ChartAxis';
// import { ChartGrid } from './components/ChartGrid';
import { ChartLegend } from './components/ChartLegend';
import { createTimeScale, createLinearScale, getXDomain, getYDomain } from './utils/scales';
import { TimeSeriesDataPoint, BaseChartProps, LegendItem, ChartDimensions } from './types';
import { chartConfig } from './config';

interface LineChartProps extends BaseChartProps {
  data?: TimeSeriesDataPoint[];
  series?: Array<{
    key: string;
    data: TimeSeriesDataPoint[];
    color: string;
    label: string;
    strokeDasharray?: string;
  }>;
  showConfidenceInterval?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
  curve?: d3.CurveFactory;
  xAxisLabel?: string;
  yAxisLabel?: string;
  onDataPointClick?: (point: TimeSeriesDataPoint, seriesKey?: string) => void;
}

/**
 * LineChart Component
 *
 * A reusable line chart component built with D3 and the chart component library.
 * Supports single or multiple series, confidence intervals, and various customizations.
 *
 * @example
 * <LineChart
 *   data={timeSeriesData}
 *   showConfidenceInterval
 *   showLegend
 *   xAxisLabel="Date"
 *   yAxisLabel="Value"
 * />
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  series,
  showConfidenceInterval = false,
  showGrid = true,
  showLegend = true,
  showDots = true,
  curve = d3.curveMonotoneX,
  xAxisLabel,
  yAxisLabel,
  onDataPointClick,
  className,
  ...baseProps
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    content: null as React.ReactNode,
    position: { x: 0, y: 0 },
  });

  const [activeSeries, setActiveSeries] = useState<string[]>([]);

  // Prepare data
  const chartData = useMemo(() => {
    if (series) {
      return series.filter(s => !activeSeries.length || activeSeries.includes(s.key));
    }
    return data ? [{ key: 'default', data, color: chartConfig.colors.primary, label: 'Value' }] : [];
  }, [data, series, activeSeries]);

  // Prepare legend items
  const legendItems: LegendItem[] = useMemo(() => {
    if (!series || !showLegend) return [];
    return series.map(s => ({
      label: s.label,
      color: s.color,
      shape: 'line' as const,
      strokeDasharray: s.strokeDasharray,
    }));
  }, [series, showLegend]);

  // Effect to render the chart
  useEffect(() => {
    if (!svgRef.current || !chartData.length) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || chartConfig.defaultWidth;
    const height = svgRef.current.clientHeight || chartConfig.defaultHeight;
    const margin = chartConfig.margin;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get all data points
    const allData = chartData.flatMap(s => s.data);

    // Create scales
    const xScale = createTimeScale(
      getXDomain(allData, 'time') as [Date, Date],
      [0, innerWidth]
    );

    const yScale = createLinearScale(
      getYDomain(allData, true, 0.1),
      [innerHeight, 0]
    );

    // Grid
    if (showGrid) {
      const gridGroup = g.append('g').attr('class', 'grid');

      // Horizontal grid lines
      yScale.ticks().forEach(tick => {
        gridGroup.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', yScale(tick))
          .attr('y2', yScale(tick))
          .attr('stroke', chartConfig.colors.grid)
          .attr('stroke-dasharray', chartConfig.grid.strokeDasharray)
          .attr('opacity', chartConfig.grid.opacity);
      });
    }

    // Line generator
    const line = d3.line<TimeSeriesDataPoint>()
      .x(d => xScale(d.x as Date))
      .y(d => yScale(d.y))
      .curve(curve);

    // Confidence interval area generator
    const area = d3.area<TimeSeriesDataPoint>()
      .x(d => xScale(d.x as Date))
      .y0(d => yScale(d.y_lower || d.y))
      .y1(d => yScale(d.y_upper || d.y))
      .curve(curve);

    // Render each series
    chartData.forEach((seriesData) => {
      const seriesGroup = g.append('g')
        .attr('class', `series series-${seriesData.key}`);

      // Confidence interval
      if (showConfidenceInterval && seriesData.data.some(d => d.y_lower !== undefined)) {
        seriesGroup.append('path')
          .datum(seriesData.data)
          .attr('fill', seriesData.color)
          .attr('fill-opacity', 0.1)
          .attr('d', area);
      }

      // Line
      seriesGroup.append('path')
        .datum(seriesData.data)
        .attr('fill', 'none')
        .attr('stroke', seriesData.color)
        .attr('stroke-width', chartConfig.lineChart.strokeWidth)
        .attr('stroke-dasharray', seriesData.strokeDasharray || '')
        .attr('d', line);

      // Dots
      if (showDots) {
        seriesGroup.selectAll('.dot')
          .data(seriesData.data)
          .enter().append('circle')
          .attr('class', 'dot')
          .attr('cx', d => xScale(d.x as Date))
          .attr('cy', d => yScale(d.y))
          .attr('r', chartConfig.lineChart.dotRadius)
          .attr('fill', seriesData.color)
          .on('mouseenter', (event, d) => {
            const content = tooltipBuilders.timeSeries(
              d.x as Date,
              [{
                label: seriesData.label,
                value: d.y,
                color: seriesData.color,
              }]
            );

            setTooltipState({
              visible: true,
              content,
              position: {
                x: event.offsetX,
                y: event.offsetY,
              },
            });
          })
          .on('mouseleave', () => {
            setTooltipState(prev => ({ ...prev, visible: false }));
          })
          .on('click', (_event, d) => {
            if (onDataPointClick) {
              onDataPointClick(d, seriesData.key);
            }
          })
          .style('cursor', onDataPointClick ? 'pointer' : 'default');
      }
    });

    // X-axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((domainValue) => d3.timeFormat('%b %d')(domainValue as Date))
      .tickPadding(chartConfig.axis.x.tickPadding);

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    // Style x-axis
    xAxisGroup.selectAll('.domain, .tick line')
      .style('stroke', chartConfig.colors.grid);
    xAxisGroup.selectAll('.tick text')
      .style('fill', chartConfig.colors.axis);

    if (xAxisLabel) {
      xAxisGroup.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', 40)
        .style('text-anchor', 'middle')
        .style('fill', chartConfig.colors.axis)
        .text(xAxisLabel);
    }

    // Y-axis
    const yAxis = d3.axisLeft(yScale)
      .tickPadding(chartConfig.axis.y.tickPadding);

    const yAxisGroup = g.append('g')
      .call(yAxis);

    // Style y-axis
    yAxisGroup.selectAll('.domain, .tick line')
      .style('stroke', chartConfig.colors.grid);
    yAxisGroup.selectAll('.tick text')
      .style('fill', chartConfig.colors.axis);

    if (yAxisLabel) {
      yAxisGroup.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -40)
        .style('text-anchor', 'middle')
        .style('fill', chartConfig.colors.axis)
        .text(yAxisLabel);
    }

  }, [chartData, showConfidenceInterval, showGrid, showDots, curve, xAxisLabel, yAxisLabel, onDataPointClick]);

  const renderContent = (dimensions: ChartDimensions) => {
    return (
      <>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="chart-svg"
        />

        {showLegend && legendItems.length > 0 && (
          <ChartLegend
            items={legendItems}
            position="top-right"
            activeItems={activeSeries}
            onItemClick={(item) => {
              setActiveSeries(prev => {
                const key = chartData.find(s => s.label === item.label)?.key;
                if (!key) return prev;

                if (prev.includes(key)) {
                  return prev.filter(k => k !== key);
                }
                return [...prev, key];
              });
            }}
          />
        )}

        <ChartTooltip
          visible={tooltipState.visible}
          content={tooltipState.content}
          position={tooltipState.position}
        />
      </>
    );
  };

  return (
    <ChartContainer className={className} {...baseProps}>
      {renderContent}
    </ChartContainer>
  );
};
