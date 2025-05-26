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
  showY05?: boolean;
  showY50?: boolean;
  showY95?: boolean;
  showEdited?: boolean;
  showActual?: boolean;
}

const TimeSeriesChart = memo(function TimeSeriesChart({
  baselineData,
  adjustedData,
  timePeriods,
  width = 600,
  height = 400,
  margin = { top: 20, right: 30, bottom: 50, left: 60 },
  className = '',
  showY05 = true,
  showY50 = true,
  showY95 = true,
  showEdited = true,
  showActual = true
}: TimeSeriesChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Zoom and brush state
  const [zoomDomain, setZoomDomain] = useState<[Date, Date] | null>(null);

  // Process the data for D3
  const baselineDataset = createChartDataset(baselineData, timePeriods);

  // Use useMemo to avoid recreating adjustedDataset on each render
  const adjustedDataset = useMemo(() => {
    return adjustedData
      ? createChartDataset(adjustedData, timePeriods)
      : [];
  }, [adjustedData, timePeriods]);

  // Generate forecast confidence intervals (y_05, y_50, y_95)
  const forecastData = useMemo(() => {
    // Use actual forecast values from the dataset if available
    const y_05Data = baselineDataset.map(d => ({
      ...d,
      value: d.y_05 !== undefined ? d.y_05 : d.value * 0.85
    }));

    const y_50Data = baselineDataset.map(d => ({
      ...d,
      value: d.y_50 !== undefined ? d.y_50 : d.value
    }));

    const y_95Data = baselineDataset.map(d => ({
      ...d,
      value: d.y_95 !== undefined ? d.y_95 : d.value * 1.15
    }));

    return { y_05Data, y_50Data, y_95Data };
  }, [baselineDataset]);

  // Get the period type from the first time period (assuming all periods have the same type)
  const periodType = timePeriods.length > 0 ? timePeriods[0].type : 'quarter';

  // Handle rendering the chart
  useEffect(() => {
    if (!svgRef.current || baselineDataset.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous rendering

    // Calculate inner dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add clip path for zooming
    svg.append('defs')
      .append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    // Create scales with zoom domain support
    const originalDomain = d3.extent(baselineDataset, d => d.date) as [Date, Date];
    const xScale = d3.scaleTime()
      .domain(zoomDomain || originalDomain)
      .range([0, innerWidth])
      .nice();

    // Calculate y-domain including all datasets
    const allValues = [...baselineDataset.map(d => d.value)];
    if (adjustedDataset.length > 0) {
      allValues.push(...adjustedDataset.map(d => d.value));
    }
    // Include forecast confidence intervals in domain calculation
    allValues.push(...forecastData.y_05Data.map(d => d.value));
    allValues.push(...forecastData.y_95Data.map(d => d.value));

    const yMax = d3.max(allValues) || 0;
    const yMin = d3.min(allValues) || 0;
    // Add some padding to the y-axis
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = d3.scaleLinear()
      .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
      .range([innerHeight, 0])
      .nice();

    // Add smooth grid lines with updated colors
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yScale.ticks(8))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', 'var(--dp-chart-grid)') // Light gray grid lines from variables
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 1);

    // Today marker removed per user request

    // Create axes - styling to match screenshot exactly
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeMonth.every(1)) // Monthly ticks for 3-month view
      .tickSize(0) // Remove tick marks
      .tickFormat(() => ''); // Empty labels since we handle them separately with custom month display

    const yAxis = d3.axisLeft(yScale)
      .ticks(height > 300 ? 8 : 5)
      .tickSize(-5) // Short ticks
      .tickFormat(d => `$${formatNumber(d as number)}k`); // Dollar format with k suffix

    // Add x-axis (horizontal) with styling using variables
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call(g => g.select(".domain").attr("stroke", "var(--dp-chart-grid)"))
      .call(g => g.selectAll(".tick line").remove()); // Remove x-axis tick lines

    // Add y-axis (vertical) with styling using variables and improved spacing
    g.append('g')
      .attr('class', 'y-axis chart-y-axis-labels')
      .call(yAxis)
      .call(g => g.select(".domain").remove()) // Remove y-axis line
      .call(g => g.selectAll(".tick line").attr("stroke", "var(--dp-chart-grid)"))
      .call(g => g.selectAll(".tick text")
        .attr("font-size", "10px")
        .attr("fill", "var(--dp-chart-axis-text)") // Using variable for text color
        .attr("dy", "0.3em")
        .attr("x", -22) // Improved spacing from chart area
        .attr("class", "forecast-values")); // Add forecast values styling

    // Add Y-axis label - "Sales ($)" using variables
    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 16)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', "var(--dp-chart-axis-text)") // Using variable for text color
      .text('Sales ($)');

    // Create line generators with monotone curves matching reference
    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Display forecast confidence intervals and data series

    // 1. y_05 (Lower confidence interval) - if enabled
    if (showY05) {
      g.append('path')
        .datum(forecastData.y_05Data)
        .attr('class', 'y05-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-forecasted)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,3') // Dashed line
        .attr('opacity', 0.7);
    }

    // 2. y_95 (Upper confidence interval) - if enabled
    if (showY95) {
      g.append('path')
        .datum(forecastData.y_95Data)
        .attr('class', 'y95-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-forecasted)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,6') // Dotted line
        .attr('opacity', 0.7);
    }

    // 3. y_50 (Median forecast) - if enabled
    if (showY50) {
      g.append('path')
        .datum(forecastData.y_50Data)
        .attr('class', 'y50-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-forecasted)')
        .attr('stroke-width', 2.5);

      // Add data points for y_50
      g.selectAll('.y50-point')
        .data(forecastData.y_50Data)
        .enter()
        .append('circle')
        .attr('class', 'y50-point')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', 4)
        .attr('fill', 'var(--dp-chart-forecasted)')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5);
    }

    // 4. Actual data (blue line) - if enabled
    if (showActual) {
      g.append('path')
        .datum(baselineDataset)
        .attr('class', 'actual-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-actual)')
        .attr('stroke-width', 2.5);

      // Add data points for actual
      g.selectAll('.actual-point')
        .data(baselineDataset)
        .enter()
        .append('circle')
        .attr('class', 'actual-point')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', 3)
        .attr('fill', 'var(--dp-chart-actual)')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5);
    }

    // 5. Edited data (yellow line) - if enabled and available
    if (showEdited && adjustedDataset.length > 0) {
      g.append('path')
        .datum(adjustedDataset)
        .attr('class', 'edited-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-edited)')
        .attr('stroke-width', 2.5);
    }

    // Add comprehensive hover functionality
    // Create bisector for finding closest data points
    const bisectDate = d3.bisector((d: { date: Date; value: number }) => d.date).left;

    // Create hover group
    const hoverGroup = g.append('g')
      .attr('class', 'hover-group')
      .style('opacity', 0);

    // Add vertical line for hover indicator
    const hoverLine = hoverGroup.append('line')
      .attr('class', 'hover-line')
      .attr('stroke', 'var(--dp-text-tertiary)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', innerHeight);

    // Add hover circles for each data series
    const hoverCircleY50 = hoverGroup.append('circle')
      .attr('class', 'hover-circle-y50')
      .attr('r', 5)
      .attr('fill', 'var(--dp-chart-forecasted)')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2);

    const hoverCircleEdited = hoverGroup.append('circle')
      .attr('class', 'hover-circle-edited')
      .attr('r', 5)
      .attr('fill', 'var(--dp-chart-edited)')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .style('opacity', 0);


    // Add brush to chart
    const brushGroup = g.append('g')
      .attr('class', 'brush');

    // Add brush for interactive zooming
    const brush = d3.brushX()
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on('start brush', (event) => {
        // Hide hover elements during brushing
        if (event.selection) {
          hoverGroup.style('opacity', 0);
          setTooltipVisible(false);
        }
      })
      .on('end', (event) => {
        const selection = event.selection;
        if (!selection) return;

        // Convert brush selection to domain
        const [x0, x1] = selection.map(xScale.invert);
        setZoomDomain([x0, x1]);

        // Clear the brush selection
        brushGroup.call(brush.move, null);
      });

    brushGroup.call(brush);

    // Apply brush styles after D3 creates the brush elements
    // Use a small timeout to ensure D3 has finished creating the elements
    setTimeout(() => {
      // Style the brush selection area (the gray rectangle when dragging)
      svg.selectAll('.brush .selection')
        .style('fill', 'var(--dp-chart-brush-fill, #3B82F6)')
        .style('fill-opacity', 0.15)
        .style('stroke', 'var(--dp-chart-brush-stroke, #3B82F6)')
        .style('stroke-width', 1)
        .style('stroke-opacity', 0.4);

      // Style the brush overlay (invisible area for interaction)
      svg.selectAll('.brush .overlay')
        .style('cursor', 'crosshair');

      // Style the brush handles (resize handles at edges)
      svg.selectAll('.brush .handle')
        .style('fill', 'var(--dp-chart-brush-handle, #1E40AF)')
        .style('fill-opacity', 0.8);
    }, 0);

    // Add hover events to the entire chart area
    svg.on('mousemove', function(event) {
      // Don't show hover if actively brushing
      const isBrushing = d3.select('.brush .selection').node() && d3.select('.brush .selection').style('display') !== 'none';
      if (isBrushing) return;

      const [mouseX] = d3.pointer(event, g.node());

      // Only show hover if mouse is within chart bounds
      if (mouseX < 0 || mouseX > innerWidth) {
        hoverGroup.style('opacity', 0);
        setTooltipVisible(false);
        return;
      }

      const xDate = xScale.invert(mouseX);

      // Find closest data points
      const i = bisectDate(forecastData.y_50Data, xDate, 1);
      const d0 = forecastData.y_50Data[i - 1];
      const d1 = forecastData.y_50Data[i];
      const d = d1 && (xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime()) ? d1 : d0;

      if (!d) return;

      // Find corresponding edited data point if available
      const editedPoint = adjustedDataset.find(adj =>
        Math.abs(adj.date.getTime() - d.date.getTime()) < 24 * 60 * 60 * 1000 // Within 1 day
      );

      // Position hover elements
      const xPos = xScale(d.date);
      const yPosY50 = yScale(d.value);

      hoverLine.attr('x1', xPos).attr('x2', xPos);
      hoverCircleY50.attr('cx', xPos).attr('cy', yPosY50);

      // Show/hide edited circle based on data availability
      if (editedPoint && showEdited) {
        const yPosEdited = yScale(editedPoint.value);
        hoverCircleEdited
          .attr('cx', xPos)
          .attr('cy', yPosEdited)
          .style('opacity', 1);
      } else {
        hoverCircleEdited.style('opacity', 0);
      }

      // Update tooltip content
      let tooltipHtml = `<div class="p-3">
        <div class="font-medium text-gray-900 text-sm mb-2">${formatDate(d.date as Date, periodType)}</div>
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-600">y_50 (Median):</span>
            <span class="text-sm font-semibold text-gray-900">$${formatNumber(d.value)}k</span>
          </div>`;

      if (editedPoint && showEdited) {
        const changeValue = (editedPoint.value - d.value) / d.value * 100;
        const change = changeValue.toFixed(1);
        const changeColor = editedPoint.value > d.value ? 'text-green-600' : 'text-red-600';
        tooltipHtml += `
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-600">Edited:</span>
            <span class="text-sm font-semibold text-gray-900">$${formatNumber(editedPoint.value)}k</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-600">Change:</span>
            <span class="text-xs font-medium ${changeColor}">${changeValue > 0 ? '+' : ''}${change}%</span>
          </div>`;
      }

      tooltipHtml += `</div></div>`;

      setTooltipContent(tooltipHtml);
      setTooltipPosition({
        x: xPos + margin.left,
        y: Math.min(yPosY50, editedPoint ? yScale(editedPoint.value) : yPosY50) + margin.top - 10
      });
      setTooltipVisible(true);
      hoverGroup.style('opacity', 1);
    })
    .on('mouseleave', function() {
      hoverGroup.style('opacity', 0);
      setTooltipVisible(false);
    })
    // Add zoom reset functionality (double-click)
    .on('dblclick', () => {
      setZoomDomain(null);
    });

    // Apply clip path to all chart elements
    g.selectAll('.y05-line, .y50-line, .y95-line, .actual-line, .edited-line')
      .attr('clip-path', 'url(#chart-clip)');

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
    showY95,
    showEdited,
    showActual,
    zoomDomain
  ]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="max-w-full bg-dp-chart-background rounded-lg border border-dp-frame-border"
      />

      {/* Zoom controls */}
      {zoomDomain && (
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={() => setZoomDomain(null)}
            className="px-3 py-1 text-xs bg-white border border-dp-frame-border rounded-md shadow-sm hover:bg-dp-background-secondary transition-colors"
            title="Reset zoom (or double-click chart)"
          >
            Reset Zoom
          </button>
        </div>
      )}

      {/* Brush instruction */}
      {!zoomDomain && (
        <div className="absolute bottom-2 left-2 z-20">
          <div className="px-2 py-1 text-xs bg-white bg-opacity-90 border border-dp-frame-border rounded text-dp-text-secondary">
            Drag to zoom • Double-click to reset
          </div>
        </div>
      )}

      {/* Tooltip - styled exactly like screenshot */}
      {tooltipVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
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

export default TimeSeriesChart;
