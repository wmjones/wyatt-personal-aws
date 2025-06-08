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


  // Process the data for D3
  const baselineDataset = createChartDataset(baselineData, timePeriods);

  // Use useMemo to avoid recreating adjustedDataset on each render
  const adjustedDataset = useMemo(() => {
    return adjustedData
      ? createChartDataset(adjustedData, timePeriods)
      : [];
  }, [adjustedData, timePeriods]);

  // Check if we have saved adjustments in the data
  const hasSavedAdjustments = useMemo(() => {
    return baselineData.some(point => point.hasAdjustment);
  }, [baselineData]);

  // Generate forecast confidence intervals (y_05, y_50, y_95)
  const forecastData = useMemo(() => {

    const y_05Data = baselineDataset.map(d => ({
      ...d,
      value: d.y_05 !== undefined ? d.y_05 : d.value * 0.85
    }));

    // For y_50 (blue line): show the forecast value (without adjustments)
    const y_50Data = baselineDataset.map(d => {
      let value;

      // When there are NO adjustments, y_50 is the forecast value
      if (!d.hasAdjustment) {
        value = d.y_50 !== undefined ? d.y_50 : d.value;
      }
      // When there ARE adjustments, we need the original forecast
      else {
        // First try original_y_50
        if (d.original_y_50 !== undefined && d.original_y_50 !== null && d.original_y_50 > 0) {
          value = d.original_y_50;
        }
        // If original_y_50 is not available, fall back to value
        else {
          value = d.value;
        }
      }

      return { ...d, value };
    });

    const y_95Data = baselineDataset.map(d => ({
      ...d,
      value: d.y_95 !== undefined ? d.y_95 : d.value * 1.15
    }));

    // For adjusted line (yellow): only show when adjustments exist
    const adjustedY50Data = [];
    if (adjustedDataset.length > 0) {
      // Use real-time adjustments from adjustedData prop
      adjustedY50Data.push(...adjustedDataset);
    } else if (hasSavedAdjustments) {
      // When we have saved adjustments, show all points
      // Points with adjustments will show adjusted values, others will show forecast
      adjustedY50Data.push(...baselineDataset.map(d => ({
        ...d,
        // Use y_50 which contains adjusted values where adjustments exist
        value: d.y_50 !== undefined ? d.y_50 : d.value
      })));
    }

    return { y_05Data, y_50Data, y_95Data, adjustedY50Data };
  }, [baselineDataset, adjustedDataset, hasSavedAdjustments]);

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
      .domain(originalDomain)
      .range([0, innerWidth])
      .nice();

    // Calculate y-domain including all datasets
    const allValues = [...baselineDataset.map(d => d.value)];
    if (adjustedDataset.length > 0) {
      allValues.push(...adjustedDataset.map(d => d.value));
    }
    // Include forecast confidence intervals in domain calculation
    allValues.push(...forecastData.y_05Data.map(d => d.value));
    allValues.push(...forecastData.y_50Data.map(d => d.value));
    allValues.push(...forecastData.y_95Data.map(d => d.value));
    if (forecastData.adjustedY50Data.length > 0) {
      allValues.push(...forecastData.adjustedY50Data.map(d => d.value));
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

    // Today marker removed per user request

    // Create axes - styling to match screenshot exactly
    const xAxis = d3.axisBottom(xScale)
      .ticks(baselineDataset.length > 30 ? d3.timeWeek.every(1) : d3.timeDay.every(Math.ceil(baselineDataset.length / 10))) // Dynamic ticks based on data
      .tickSize(0) // Remove tick marks
      .tickFormat(() => ''); // Empty labels since we handle them separately with custom month display

    const yAxis = d3.axisLeft(yScale)
      .ticks(height > 300 ? 8 : 5)
      .tickSize(-5) // Short ticks
      .tickFormat(d => formatNumber(d as number, true)); // Use currency formatting

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
    // Color scheme:
    // - Blue (--dp-chart-forecasted): y_50 median forecast
    // - Yellow (--dp-chart-edited): Adjusted forecast values
    // - Red (--dp-chart-actual): y_05/y_95 forecast range

    // 1. y_05 (Lower confidence interval) - if enabled
    if (showY05) {
      g.append('path')
        .datum(forecastData.y_05Data)
        .attr('class', 'y05-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-actual)') // Use red for confidence intervals
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,3') // Dashed line
        .attr('opacity', 0.4); // Lower opacity for confidence intervals
    }

    // 2. y_95 (Upper confidence interval) - if enabled
    if (showY95) {
      g.append('path')
        .datum(forecastData.y_95Data)
        .attr('class', 'y95-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-actual)') // Use red for confidence intervals
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,6') // Dotted line
        .attr('opacity', 0.4); // Lower opacity for confidence intervals
    }

    // 3. y_50 (Median forecast) - if enabled
    if (showY50) {
      // Base y_50 line (blue)
      g.append('path')
        .datum(forecastData.y_50Data)
        .attr('class', 'y50-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-forecasted)') // Blue for median forecast
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
        .attr('fill', 'var(--dp-chart-forecasted)') // Blue for median forecast
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5);

      // Adjusted line (yellow) when adjustments exist
      if (forecastData.adjustedY50Data.length > 0) {
        g.append('path')
          .datum(forecastData.adjustedY50Data)
          .attr('class', 'adjusted-line')
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', 'var(--dp-chart-edited)') // Yellow color for adjustments
          .attr('stroke-width', 2.5);

        // Add data points for adjusted line
        g.selectAll('.adjusted-point')
          .data(forecastData.adjustedY50Data)
          .enter()
          .append('circle')
          .attr('class', 'adjusted-point')
          .attr('cx', d => xScale(d.date))
          .attr('cy', d => yScale(d.value))
          .attr('r', 4)
          .attr('fill', 'var(--dp-chart-edited)') // Yellow color for adjustments
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 1.5);
      }
    }

    // 4. Actual data - DISABLED to avoid confusion
    // The "actual" line was using baselineDataset which is forecast data, not actual sales
    // Commenting out to simplify the visualization
    /*
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
    */

    // 5. Edited data - DISABLED as we handle adjustments in the y_50/adjusted lines above
    /*
    if (showEdited && adjustedDataset.length > 0) {
      g.append('path')
        .datum(adjustedDataset)
        .attr('class', 'edited-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'var(--dp-chart-edited)')
        .attr('stroke-width', 2.5);
    }
    */

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

    // Add hover circle for y_50
    const hoverCircleY50 = hoverGroup.append('circle')
      .attr('class', 'hover-circle-y50')
      .attr('r', 5)
      .attr('fill', 'var(--dp-chart-forecasted)') // Blue to match y_50 line
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2);



    // Add hover events to the entire chart area
    svg.on('mousemove', function(event) {

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
      const basePoint = d1 && (xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime()) ? d1 : d0;

      if (!basePoint) return;

      // Find corresponding adjusted point if exists
      let adjustedPoint = null;
      if (forecastData.adjustedY50Data.length > 0) {
        const adjI = bisectDate(forecastData.adjustedY50Data, xDate, 1);
        const adjD0 = forecastData.adjustedY50Data[adjI - 1];
        const adjD1 = forecastData.adjustedY50Data[adjI];
        adjustedPoint = adjD1 && (xDate.getTime() - adjD0.date.getTime() > adjD1.date.getTime() - xDate.getTime()) ? adjD1 : adjD0;
      }

      // Position hover elements
      const xPos = xScale(basePoint.date);
      const yPosY50 = yScale(basePoint.value);

      hoverLine.attr('x1', xPos).attr('x2', xPos);
      hoverCircleY50.attr('cx', xPos).attr('cy', yPosY50)
        .attr('fill', 'var(--dp-chart-forecasted)'); // Make hover circle blue to match y_50 line

      // Update tooltip content - show both y_50 and adjusted values
      let tooltipHtml = `<div class="p-2">
        <div class="text-xs text-gray-600">${formatDate(basePoint.date as Date, periodType)}</div>`;

      // Always show y_50 value
      tooltipHtml += `
        <div class="text-sm">
          <span class="text-gray-600">y_50:</span> <span class="text-gray-700">$${formatNumber(basePoint.value)}k</span>
        </div>`;

      // Show adjusted value if it exists
      if (adjustedPoint) {
        const adjustmentPercent = ((adjustedPoint.value - basePoint.value) / basePoint.value) * 100;
        tooltipHtml += `
          <div class="text-sm font-semibold" style="color: var(--dp-chart-edited, #FCD34D);">
            <span>Adjusted:</span> $${formatNumber(adjustedPoint.value)}k
            <span class="text-xs">(${adjustmentPercent > 0 ? '+' : ''}${adjustmentPercent.toFixed(1)}%)</span>
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

    // Apply clip path to all chart elements
    g.selectAll('.y05-line, .y50-line, .y95-line, .actual-line, .edited-line, .adjusted-line')
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
    hasSavedAdjustments
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
});

export default TimeSeriesChart;
