'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ForecastDataPoint, TimePeriod } from '@/app/types/demand-planning';
import { BaseChartProps } from './BaseChart';
import { createChartDataset, formatNumber, formatDate } from '@/app/demand-planning/lib/chart-utils';

interface TimeSeriesChartProps extends Omit<BaseChartProps, 'className'> {
  baselineData: ForecastDataPoint[];
  adjustedData?: ForecastDataPoint[];
  timePeriods: TimePeriod[];
  className?: string;
  showForecasted?: boolean;
  showEdited?: boolean;
  showActual?: boolean;
  showActual2024?: boolean;
  showActual2023?: boolean;
}

export default function TimeSeriesChart({
  baselineData,
  adjustedData,
  timePeriods,
  width = 600,
  height = 400,
  margin = { top: 20, right: 30, bottom: 50, left: 60 },
  className = '',
  showForecasted = true,
  showEdited = true,
  showActual = true,
  showActual2024 = false,
  showActual2023 = false
}: TimeSeriesChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Process the data for D3
  const baselineDataset = createChartDataset(baselineData, timePeriods);
  // Use useMemo to avoid recreating adjustedDataset on each render
  const adjustedDataset = useMemo(() => {
    return adjustedData
      ? createChartDataset(adjustedData, timePeriods)
      : [];
  }, [adjustedData, timePeriods]);

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

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(baselineDataset, d => d.date) as [Date, Date])
      .range([0, innerWidth])
      .nice();

    // Calculate y-domain including both datasets
    const allValues = [...baselineDataset.map(d => d.value)];
    if (adjustedDataset.length > 0) {
      allValues.push(...adjustedDataset.map(d => d.value));
    }

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

    // Find "today" in the data - May 20, 2025 to match screenshot
    const today = new Date(2025, 4, 20); // May 20, 2025
    const todayXPosition = xScale(today);

    // Add today vertical line - pinkish red with Today pill
    if (todayXPosition) {
      // Add vertical line
      g.append('line')
        .attr('x1', todayXPosition)
        .attr('x2', todayXPosition)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', 'var(--dp-chart-today-line)') // Light red color from updated variables
        .attr('stroke-width', 1);

      // Add "Today" label pill at the top
      g.append('rect')
        .attr('x', todayXPosition - 22)
        .attr('y', -5)
        .attr('width', 44)
        .attr('height', 20)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('fill', 'var(--dp-chart-today-pill-bg)');

      g.append('text')
        .attr('x', todayXPosition)
        .attr('y', 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'var(--primary)') // Primary red from our palette
        .attr('font-weight', '500')
        .text('Today');
    }

    // Create axes - styling to match screenshot exactly
    const xAxis = d3.axisBottom(xScale)
      .ticks(width > 600 ? 6 : 5)
      .tickSize(0) // Remove tick marks
      .tickFormat(() => ''); // Empty labels since we handle them separately with custom weekday display

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

    // Display data series based on toggle status - exactly matching screenshot

    // 1. 2023 Actual (green line) - if enabled
    if (showActual2023) {
      const mockData2023 = baselineDataset.map(d => ({
        ...d,
        value: d.value * 0.95 - 2000
      }));

      g.append('path')
        .datum(mockData2023)
        .attr('class', '2023-actual-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-actual-2023)') // Green line from variables
        .attr('stroke-width', 2);
    }

    // 2. 2024 Actual (orange line) - if enabled
    if (showActual2024) {
      const mockData2024 = baselineDataset.map(d => ({
        ...d,
        value: d.value * 0.9
      }));

      g.append('path')
        .datum(mockData2024)
        .attr('class', '2024-actual-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-actual-2024)') // Amber/orange line from variables
        .attr('stroke-width', 2);
    }

    // 3. Actual data (blue line) - if enabled
    if (showActual) {
      g.append('path')
        .datum(baselineDataset)
        .attr('class', 'actual-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-actual)') // Blue line from variables
        .attr('stroke-width', 2.5);

      // Add data points for actual (blue circles)
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

    // 4. Edited data (gold/yellow line) - if enabled and available
    if (showEdited && adjustedDataset.length > 0) {
      g.append('path')
        .datum(adjustedDataset)
        .attr('class', 'edited-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-edited)') // Yellow line from variables
        .attr('stroke-width', 2.5);
    }

    // 5. Forecasted data (red dotted line) - if enabled - MUST BE DRAWN LAST TO BE ON TOP
    if (showForecasted) {
      // Create forecast data with a slightly upward trend
      const forecastData = baselineDataset.map(d => ({
        ...d,
        value: d.value * 1.1
      }));

      // Draw dashed line
      g.append('path')
        .datum(forecastData)
        .attr('class', 'forecast-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-forecasted)') // Red line from updated colors
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4'); // Dashed line

      // Add forecast data points (red circles)
      g.selectAll('.forecast-point')
        .data(forecastData)
        .enter()
        .append('circle')
        .attr('class', 'forecast-point')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', 4)
        .attr('fill', 'var(--dp-chart-forecasted)') // Red dots from updated colors
        .attr('stroke', '#FFFFFF') // White border
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 6);

          // Show tooltip exactly matching screenshot style
          setTooltipContent(`<div class="p-3">
            <div class="font-medium text-gray-900 text-sm">Forecasted</div>
            <div class="text-gray-500 text-xs mt-1">${formatDate(d.date as Date, periodType)}</div>
            <div class="text-base font-semibold mt-1 text-gray-900">$${formatNumber(d.value)}k</div>
          </div>`);

          setTooltipPosition({
            x: xScale(d.date) + margin.left,
            y: yScale(d.value) + margin.top - 15
          });

          setTooltipVisible(true);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 4);
          setTooltipVisible(false);
        });
    }

  }, [
    baselineDataset,
    adjustedDataset,
    width,
    height,
    margin,
    periodType,
    showForecasted,
    showEdited,
    showActual,
    showActual2024,
    showActual2023
  ]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="max-w-full bg-dp-chart-background rounded-lg border border-dp-frame-border"
      />

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
}
