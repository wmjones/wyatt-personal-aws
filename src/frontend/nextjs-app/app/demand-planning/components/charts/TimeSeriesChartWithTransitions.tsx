'use client';

import { useRef, useEffect, useState, useMemo, memo } from 'react';
import * as d3 from 'd3';
import { ForecastDataPoint, TimePeriod } from '@/app/types/demand-planning';
import { BaseChartProps } from './BaseChart';
import { createChartDataset, formatNumber, formatDate } from '@/app/demand-planning/lib/chart-utils';

interface TimeSeriesChartProps extends Omit<BaseChartProps, 'className'> {
  baselineData: ForecastDataPoint[];
  adjustedData?: ForecastDataPoint[];
  timePeriods: TimePeriod[];
  className?: string;
  margin?: { top: number; right: number; bottom: number; left: number };
  showY05?: boolean;
  showY50?: boolean;
  showY95?: boolean;
}

const TimeSeriesChartWithTransitions = memo(function TimeSeriesChartWithTransitions({
  baselineData,
  adjustedData,
  timePeriods,
  width = 600,
  height = 400,
  margin = { top: 20, right: 30, bottom: 50, left: 60 },
  className = '',
  showY05 = true,
  showY50 = true,
  showY95 = true
}: TimeSeriesChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const isInitialRender = useRef(true);

  // Process the data for D3
  const baselineDataset = createChartDataset(baselineData, timePeriods);

  // Use useMemo to avoid recreating adjustedDataset on each render
  const adjustedDataset = useMemo(() => {
    return adjustedData
      ? createChartDataset(adjustedData, timePeriods)
      : [];
  }, [adjustedData, timePeriods]);

  // Simplified forecast data processing
  const forecastData = useMemo(() => {
    // 1. Red lines: Confidence intervals (y_05 and y_95)
    const y_05Data = baselineDataset.map(d => ({
      ...d,
      value: d.y_05 !== undefined ? d.y_05 : d.value * 0.85
    }));

    const y_95Data = baselineDataset.map(d => ({
      ...d,
      value: d.y_95 !== undefined ? d.y_95 : d.value * 1.15
    }));

    // 2. Blue line: Always show the median forecast (y_50)
    const y_50Data = baselineDataset.map(d => ({
      ...d,
      value: d.y_50 !== undefined ? d.y_50 : d.value
    }));

    // 3. Yellow line: Show adjusted values when they exist
    let adjustedY50Data: typeof baselineDataset = [];
    if (adjustedDataset.length > 0) {
      // Use the provided adjusted data
      adjustedY50Data = adjustedDataset;
    }

    return { y_05Data, y_50Data, y_95Data, adjustedY50Data };
  }, [baselineDataset, adjustedDataset]);

  // Get the period type from the first time period (assuming all periods have the same type)
  const periodType = timePeriods.length > 0 ? timePeriods[0].type : 'quarter';

  // Handle rendering the chart with transitions
  useEffect(() => {
    if (!svgRef.current || baselineDataset.length === 0) return;

    const svg = d3.select(svgRef.current);
    const duration = isInitialRender.current ? 0 : 750; // No animation on initial render

    // Calculate inner dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create or select main group
    let g = svg.select<SVGGElement>('g.main-group');
    if (g.empty()) {
      g = svg.append('g')
        .attr('class', 'main-group')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    }

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(baselineDataset, d => d.date) as [Date, Date])
      .range([0, innerWidth])
      .nice();

    // Calculate y-domain including all datasets
    const allValues = [...baselineDataset.map(d => d.value)];
    if (adjustedDataset.length > 0) {
      allValues.push(...adjustedDataset.map(d => d.value));
    }
    allValues.push(...forecastData.y_05Data.map(d => d.value));
    allValues.push(...forecastData.y_50Data.map(d => d.value));
    allValues.push(...forecastData.y_95Data.map(d => d.value));
    if (forecastData.adjustedY50Data.length > 0) {
      allValues.push(...forecastData.adjustedY50Data.map(d => d.value));
    }

    const yMax = d3.max(allValues) || 0;
    const yMin = d3.min(allValues) || 0;
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = d3.scaleLinear()
      .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
      .range([innerHeight, 0])
      .nice();

    // Update grid lines with transition
    const gridLines = g.selectAll<SVGLineElement, number>('.grid-line')
      .data(yScale.ticks(8));

    gridLines.enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('stroke', '#F3F4F6')
      .attr('stroke-width', 0.5)
      .merge(gridLines)
      .transition()
      .duration(duration)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d));

    gridLines.exit().remove();

    // Update axes with transitions
    const xAxis = d3.axisBottom(xScale)
      .ticks(baselineDataset.length > 30 ? d3.timeWeek.every(1) : d3.timeDay.every(Math.ceil(baselineDataset.length / 10)))
      .tickSize(0)
      .tickFormat(() => '');

    const yAxis = d3.axisLeft(yScale)
      .ticks(height > 300 ? 8 : 5)
      .tickSize(-5)
      .tickFormat(d => formatNumber(d as number, true));

    // Update x-axis
    let xAxisG = g.select<SVGGElement>('.x-axis');
    if (xAxisG.empty()) {
      xAxisG = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`);
    }
    xAxisG.transition().duration(duration).call(xAxis);
    xAxisG.select('.domain').attr('stroke', '#E5E7EB');
    xAxisG.selectAll('.tick line').remove();

    // Update y-axis
    let yAxisG = g.select<SVGGElement>('.y-axis');
    if (yAxisG.empty()) {
      yAxisG = g.append('g')
        .attr('class', 'y-axis chart-y-axis-labels');
    }
    yAxisG.transition().duration(duration).call(yAxis);
    yAxisG.select('.domain').remove();
    yAxisG.selectAll('.tick line').attr('stroke', '#E5E7EB');
    yAxisG.selectAll('.tick text')
      .attr('font-size', '12px')
      .attr('fill', '#6B7280')
      .attr('dy', '0.3em')
      .attr('x', -12)
      .attr('class', 'text-caption');

    // Line generator
    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Update lines with transitions
    const updateLine = (className: string, data: Array<{ date: Date; value: number }>, color: string, strokeWidth: number, dashArray?: string, opacity?: number) => {
      let path = g.select<SVGPathElement>(`.${className}`);

      if (path.empty() && data.length > 0) {
        path = g.append('path')
          .attr('class', className)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', strokeWidth)
          .attr('clip-path', 'url(#chart-clip)');

        if (dashArray) path.attr('stroke-dasharray', dashArray);
        if (opacity !== undefined) path.attr('opacity', opacity);

        // Initial animation: draw the line
        const totalLength = (path.node() as SVGPathElement).getTotalLength();
        path
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .datum(data)
          .attr('d', line)
          .transition()
          .duration(duration * 1.5)
          .ease(d3.easeSinInOut)
          .attr('stroke-dashoffset', 0)
          .on('end', function() {
            if (dashArray) {
              d3.select(this).attr('stroke-dasharray', dashArray);
            } else {
              d3.select(this).attr('stroke-dasharray', null);
            }
          });
      } else if (data.length > 0) {
        // Update existing line with transition
        path
          .datum(data)
          .transition()
          .duration(duration)
          .attr('d', line);
      } else {
        // Remove line if no data
        path.remove();
      }
    };

    // Update confidence interval lines
    if (showY05) {
      updateLine('y05-line', forecastData.y_05Data, 'var(--dp-chart-actual)', 1.5, '6,3', 0.4);
    }

    if (showY95) {
      updateLine('y95-line', forecastData.y_95Data, 'var(--dp-chart-actual)', 1.5, '3,6', 0.4);
    }

    // Update main forecast line
    if (showY50) {
      updateLine('y50-line', forecastData.y_50Data, 'var(--dp-chart-forecasted)', 2.5);

      // Update data points with transition
      const y50Points = g.selectAll<SVGCircleElement, { date: Date; value: number }>('.y50-point')
        .data(forecastData.y_50Data);

      y50Points.enter()
        .append('circle')
        .attr('class', 'y50-point')
        .attr('r', 0)
        .attr('fill', 'var(--dp-chart-forecasted)')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .transition()
        .duration(duration)
        .attr('r', 4);

      y50Points
        .transition()
        .duration(duration)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value));

      y50Points.exit()
        .transition()
        .duration(duration)
        .attr('r', 0)
        .remove();

      // Update adjusted line if exists
      if (forecastData.adjustedY50Data.length > 0) {
        updateLine('adjusted-line', forecastData.adjustedY50Data, 'var(--dp-chart-edited)', 2.5);

        // Update adjusted data points
        const adjustedPoints = g.selectAll<SVGCircleElement, { date: Date; value: number }>('.adjusted-point')
          .data(forecastData.adjustedY50Data);

        adjustedPoints.enter()
          .append('circle')
          .attr('class', 'adjusted-point')
          .attr('r', 0)
          .attr('fill', 'var(--dp-chart-edited)')
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 1.5)
          .attr('cx', d => xScale(d.date))
          .attr('cy', d => yScale(d.value))
          .transition()
          .duration(duration)
          .attr('r', 4);

        adjustedPoints
          .transition()
          .duration(duration)
          .attr('cx', d => xScale(d.date))
          .attr('cy', d => yScale(d.value));

        adjustedPoints.exit()
          .transition()
          .duration(duration)
          .attr('r', 0)
          .remove();
      } else {
        // Remove adjusted line and points if no data
        g.select('.adjusted-line').remove();
        g.selectAll('.adjusted-point').remove();
      }
    }

    // Set up hover functionality (same as original)
    const bisectDate = d3.bisector((d: { date: Date; value: number }) => d.date).left;

    let hoverGroup = g.select<SVGGElement>('.hover-group');
    if (hoverGroup.empty()) {
      hoverGroup = g.append('g')
        .attr('class', 'hover-group')
        .style('opacity', 0);

      hoverGroup.append('line')
        .attr('class', 'hover-line')
        .attr('stroke', 'var(--dp-text-tertiary)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('y1', 0)
        .attr('y2', innerHeight);

      hoverGroup.append('circle')
        .attr('class', 'hover-circle-y50')
        .attr('r', 5)
        .attr('fill', 'var(--dp-chart-forecasted)')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 2);
    }

    // Mouse events
    svg.on('mousemove', function(event) {
      const [mouseX] = d3.pointer(event, g.node());

      if (mouseX < 0 || mouseX > innerWidth) {
        hoverGroup.style('opacity', 0);
        setTooltipVisible(false);
        return;
      }

      const xDate = xScale.invert(mouseX);
      const i = bisectDate(forecastData.y_50Data, xDate, 1);
      const d0 = forecastData.y_50Data[i - 1];
      const d1 = forecastData.y_50Data[i];
      const basePoint = d1 && (xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime()) ? d1 : d0;

      if (!basePoint) return;

      let adjustedPoint = null;
      if (forecastData.adjustedY50Data.length > 0) {
        const adjI = bisectDate(forecastData.adjustedY50Data, xDate, 1);
        const adjD0 = forecastData.adjustedY50Data[adjI - 1];
        const adjD1 = forecastData.adjustedY50Data[adjI];
        adjustedPoint = adjD1 && (xDate.getTime() - adjD0.date.getTime() > adjD1.date.getTime() - xDate.getTime()) ? adjD1 : adjD0;
      }

      const xPos = xScale(basePoint.date);
      const yPosY50 = yScale(basePoint.value);

      hoverGroup.select('.hover-line')
        .attr('x1', xPos)
        .attr('x2', xPos);

      hoverGroup.select('.hover-circle-y50')
        .attr('cx', xPos)
        .attr('cy', yPosY50);

      // Tooltip content
      let tooltipHtml = `<div class="p-3">
        <div class="text-caption text-dp-text-tertiary mb-1">${formatDate(basePoint.date as Date, periodType)}</div>`;

      tooltipHtml += `
        <div class="text-body">
          <span class="text-dp-text-secondary">Forecast:</span> <span class="text-dp-text-primary font-medium">$${formatNumber(basePoint.value)}k</span>
        </div>`;

      if (adjustedPoint) {
        const adjustmentPercent = ((adjustedPoint.value - basePoint.value) / basePoint.value) * 100;
        tooltipHtml += `
          <div class="text-body font-semibold mt-1" style="color: var(--dp-chart-edited);">
            <span>Adjusted:</span> $${formatNumber(adjustedPoint.value)}k
            <span class="text-micro ml-1">(${adjustmentPercent > 0 ? '+' : ''}${adjustmentPercent.toFixed(1)}%)</span>
          </div>`;
      }

      tooltipHtml += `</div>`;

      setTooltipContent(tooltipHtml);
      setTooltipPosition({
        x: xPos + margin.left,
        y: yPosY50 + margin.top - 10
      });
      setTooltipVisible(true);
      hoverGroup.style('opacity', 1);
    })
    .on('mouseleave', function() {
      hoverGroup.style('opacity', 0);
      setTooltipVisible(false);
    });

    // Update legend with transitions
    const legendData = [
      { label: 'Forecast (y_50)', color: 'var(--dp-chart-forecasted)' },
      ...(forecastData.adjustedY50Data.length > 0 ? [{ label: 'Adjusted', color: 'var(--dp-chart-edited)' }] : []),
      { label: 'Confidence Range', color: 'var(--dp-chart-actual)', dashed: true }
    ];

    let legendGroup = g.select<SVGGElement>('.legend');
    if (legendGroup.empty()) {
      legendGroup = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${innerWidth - 150}, 10)`);
    }

    const legendItems = legendGroup.selectAll<SVGGElement, typeof legendData[0]>('.legend-item')
      .data(legendData, d => d.label);

    const legendEnter = legendItems.enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('opacity', 0);

    legendEnter.each(function(item) {
      const g = d3.select(this);

      if (item.dashed) {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', 20)
          .attr('y1', 5)
          .attr('y2', 5)
          .attr('stroke', item.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,2');
      } else {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', 20)
          .attr('y1', 5)
          .attr('y2', 5)
          .attr('stroke', item.color)
          .attr('stroke-width', 2.5);
      }

      g.append('text')
        .attr('x', 25)
        .attr('y', 5)
        .attr('dy', '0.3em')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('fill', 'var(--dp-text-secondary)')
        .attr('class', 'text-micro')
        .text(item.label);
    });

    legendItems.merge(legendEnter)
      .transition()
      .duration(duration)
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)
      .attr('opacity', 1);

    legendItems.exit()
      .transition()
      .duration(duration)
      .attr('opacity', 0)
      .remove();

    isInitialRender.current = false;
  }, [
    baselineDataset,
    adjustedDataset,
    forecastData,
    width,
    height,
    margin,
    periodType,
    showY05,
    showY50,
    showY95
  ]);

  return (
    <div className={`relative p-8 bg-white rounded-lg ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="max-w-full"
      />

      {/* Tooltip - updated styling with design requirements */}
      {tooltipVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-10 bg-white border border-[#E5E7EB] rounded-md shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 10}px`,
          }}
          dangerouslySetInnerHTML={{ __html: tooltipContent }}
        />
      )}
    </div>
  );
});

export default TimeSeriesChartWithTransitions;
