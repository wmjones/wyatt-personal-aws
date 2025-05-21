'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { ForecastDataPoint, TimePeriod } from '@/app/types/demand-planning';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseChartProps } from './BaseChart';
import {
  createChartDataset,
  formatNumber,
  formatDate,
  calculatePercentageChange,
  getChangeColor
} from '@/app/demand-planning/lib/chart-utils';

interface ComparisonChartProps extends Omit<BaseChartProps, 'className'> {
  baselineData: ForecastDataPoint[];
  adjustedData: ForecastDataPoint[];
  timePeriods: TimePeriod[];
  className?: string;
}

export default function ComparisonChart({
  baselineData,
  adjustedData,
  timePeriods,
  width = 600,
  height = 400,
  margin = { top: 20, right: 30, bottom: 50, left: 60 },
  className = ''
}: ComparisonChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Process the data for D3
  const baselineDataset = createChartDataset(baselineData, timePeriods);
  const adjustedDataset = createChartDataset(adjustedData, timePeriods);

  // Calculate percentage differences for the bar chart
  const comparisonDataset = baselineDataset.map(baseline => {
    const adjusted = adjustedDataset.find(d => d.periodId === baseline.periodId);
    if (!adjusted) return null;

    const percentChange = calculatePercentageChange(baseline.value, adjusted.value);

    return {
      periodId: baseline.periodId,
      date: baseline.date,
      baselineValue: baseline.value,
      adjustedValue: adjusted.value,
      percentChange
    };
  }).filter(Boolean) as {
    periodId: string;
    date: Date;
    baselineValue: number;
    adjustedValue: number;
    percentChange: number;
  }[];

  // Get the period type from the first time period
  const periodType = timePeriods.length > 0 ? timePeriods[0].type : 'quarter';

  // Handle rendering the chart
  useEffect(() => {
    if (!svgRef.current || comparisonDataset.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous rendering

    // Calculate inner dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(comparisonDataset.map(d => formatDate(d.date, periodType)))
      .range([0, innerWidth])
      .padding(0.2);

    // Find the max absolute percentage change to make the y-scale symmetric
    const maxChange = d3.max(comparisonDataset, d => Math.abs(d.percentChange)) || 10;

    const yScale = d3.scaleLinear()
      .domain([-maxChange * 1.1, maxChange * 1.1])
      .range([innerHeight, 0])
      .nice();

    // Create axes
    const xAxis = d3.axisBottom(xScale);

    const yAxis = d3.axisLeft(yScale)
      .ticks(height > 300 ? 8 : 5)
      .tickFormat(d => `${d}%`);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yScale.ticks())
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', 'var(--dp-border-light)')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2,2');

    // Add zero line with stronger emphasis
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', 'var(--dp-border-medium)')
      .attr('stroke-width', 1);

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${yScale(0)})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '10px')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-35)');

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '10px');

    // Add axis labels
    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 10)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'var(--dp-text-secondary)')
      .text('% Change from Baseline');

    // Add bars
    const bars = g.selectAll('.bar')
      .data(comparisonDataset)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(formatDate(d.date, periodType)) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => d.percentChange >= 0 ? yScale(d.percentChange) : yScale(0))
      .attr('height', d => Math.abs(yScale(d.percentChange) - yScale(0)))
      .attr('fill', d => getChangeColor(d.percentChange))
      .attr('rx', 2) // Rounded corners
      .attr('ry', 2)
      .style('cursor', 'pointer');

    // Add tooltip interaction
    bars
      .on('mouseover', function(event, d) {
        const isPositive = d.percentChange >= 0;
        const tooltipContent = `
          <div class="p-2">
            <div class="text-xs font-medium">${formatDate(d.date, periodType)}</div>
            <div class="text-sm">
              <span class="font-medium">Baseline:</span> ${formatNumber(d.baselineValue)}
            </div>
            <div class="text-sm">
              <span class="font-medium">Adjusted:</span> ${formatNumber(d.adjustedValue)}
            </div>
            <div class="text-sm font-medium mt-1" style="color: ${getChangeColor(d.percentChange)}">
              ${isPositive ? '+' : ''}${d.percentChange.toFixed(1)}%
            </div>
          </div>
        `;

        const xPosition = (xScale(formatDate(d.date, periodType)) || 0) + xScale.bandwidth() / 2 + margin.left;
        const yPosition = (d.percentChange >= 0 ? yScale(d.percentChange) : yScale(0)) + margin.top;

        setTooltipContent(tooltipContent);
        setTooltipPosition({ x: xPosition, y: yPosition });
        setTooltipVisible(true);

        d3.select(this)
          .attr('opacity', 0.8);
      })
      .on('mouseout', function() {
        setTooltipVisible(false);
        d3.select(this)
          .attr('opacity', 1);
      });

    // Add labels for significant changes
    g.selectAll('.bar-label')
      .data(comparisonDataset.filter(d => Math.abs(d.percentChange) > 5))
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => (xScale(formatDate(d.date, periodType)) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => d.percentChange >= 0
        ? yScale(d.percentChange) - 5
        : yScale(d.percentChange) + 15
      )
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', d => d.percentChange >= 0 ? 'var(--dp-ui-positive)' : 'var(--dp-ui-negative)')
      .text(d => `${d.percentChange >= 0 ? '+' : ''}${d.percentChange.toFixed(1)}%`);

    // Add title
    g.append('text')
      .attr('class', 'chart-title')
      .attr('x', innerWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '500')
      .attr('fill', 'var(--dp-text-primary)')
      .text('Forecast Adjustment Impact (%)');

  }, [comparisonDataset, width, height, margin, periodType]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="max-w-full bg-dp-surface-primary rounded-lg border border-dp-border-light"
      />

      {/* Tooltip */}
      {tooltipVisible && (
        <div
          className="absolute z-10 bg-dp-surface-secondary backdrop-blur-sm border border-dp-border-light rounded-md shadow-dp-medium pointer-events-none transform -translate-x-1/2 -translate-y-full"
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
