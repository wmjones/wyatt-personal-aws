'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DateForecast {
  business_date: string;
  y_05: number;
  y_50: number;
  y_95: number;
}

interface ForecastChartProps {
  data: DateForecast[];
}

/**
 * Forecast Chart Component
 *
 * This component displays forecast data over time using D3.js
 */
export default function ForecastChart({ data }: ForecastChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Parse dates and prepare data
    const parsedData = data.map(d => ({
      date: new Date(d.business_date),
      y_05: d.y_05,
      y_50: d.y_50,
      y_95: d.y_95
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date) as [Date, Date])
      .range([0, width]);

    // Find min and max values across all percentiles
    const yMin = d3.min(parsedData, d => d.y_05) as number;
    const yMax = d3.max(parsedData, d => d.y_95) as number;

    const yScale = d3.scaleLinear()
      .domain([yMin * 0.9, yMax * 1.1])
      .range([height, 0]);

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale));

    // Add X axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .text('Date');

    // Add Y axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .text('Forecast Value');

    // Define area generator for confidence interval
    const area = d3.area<{ date: Date; y_05: number; y_50: number; y_95: number }>()
      .x(d => xScale(d.date))
      .y0(d => yScale(d.y_05))
      .y1(d => yScale(d.y_95))
      .curve(d3.curveMonotoneX);

    // Add confidence interval area (y_05 to y_95)
    svg.append('path')
      .datum(parsedData)
      .attr('fill', '#4f46e5')
      .attr('fill-opacity', 0.2)
      .attr('d', area);

    // Define line generators for each percentile
    const lineY50 = d3.line<{ date: Date; y_05: number; y_50: number; y_95: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.y_50))
      .curve(d3.curveMonotoneX);

    const lineY05 = d3.line<{ date: Date; y_05: number; y_50: number; y_95: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.y_05))
      .curve(d3.curveMonotoneX);

    const lineY95 = d3.line<{ date: Date; y_05: number; y_50: number; y_95: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.y_95))
      .curve(d3.curveMonotoneX);

    // Add the 5th percentile line
    svg.append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('d', lineY05);

    // Add the 95th percentile line
    svg.append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('d', lineY95);

    // Add the median line (50th percentile)
    svg.append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', '#4f46e5')
      .attr('stroke-width', 3)
      .attr('d', lineY50);

    // Add tooltip functionality
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '5px 10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, 20)`);

    // Legend items
    const legendData = [
      { label: 'Median (50th)', color: '#4f46e5', dash: null as string | null, width: 3 },
      { label: '5th percentile', color: '#94a3b8', dash: '3,3', width: 1 },
      { label: '95th percentile', color: '#94a3b8', dash: '3,3', width: 1 },
      { label: 'Confidence band', color: '#4f46e5', opacity: 0.2, isArea: true }
    ];

    legendData.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      if (item.isArea) {
        legendItem.append('rect')
          .attr('width', 20)
          .attr('height', 10)
          .attr('fill', item.color)
          .attr('fill-opacity', item.opacity);
      } else {
        legendItem.append('line')
          .attr('x1', 0)
          .attr('x2', 20)
          .attr('y1', 5)
          .attr('y2', 5)
          .attr('stroke', item.color)
          .attr('stroke-width', item.width ?? 1)
          .attr('stroke-dasharray', item.dash ?? 'none');
      }

      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 9)
        .attr('font-size', '12px')
        .attr('fill', 'currentColor')
        .text(item.label);
    });

    // Add interactive hover effect
    const bisectDate = d3.bisector<{ date: Date; y_05: number; y_50: number; y_95: number }, Date>(d => d.date).left;

    // Create focus elements
    const focus = svg.append('g')
      .style('display', 'none');

    focus.append('circle')
      .attr('r', 5)
      .attr('fill', '#4f46e5');

    focus.append('line')
      .attr('class', 'focus-line')
      .style('stroke', '#94a3b8')
      .style('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', height);

    // Create overlay for mouse tracking
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => {
        focus.style('display', null);
        tooltip.style('visibility', 'visible');
      })
      .on('mouseout', () => {
        focus.style('display', 'none');
        tooltip.style('visibility', 'hidden');
      })
      .on('mousemove', function(event) {
        const [xPos] = d3.pointer(event);
        const x0 = xScale.invert(xPos);
        const i = bisectDate(parsedData, x0, 1);
        const d0 = parsedData[i - 1];
        const d1 = parsedData[i];

        if (!d0 || !d1) return;

        const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;

        focus.attr('transform', `translate(${xScale(d.date)},${yScale(d.y_50)})`);
        focus.select('.focus-line').attr('y2', height - yScale(d.y_50));

        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px')
          .html(`
            <strong>Date:</strong> ${d.date.toLocaleDateString()}<br>
            <strong>5th %ile:</strong> ${d.y_05.toFixed(2)}<br>
            <strong>Median:</strong> ${d.y_50.toFixed(2)}<br>
            <strong>95th %ile:</strong> ${d.y_95.toFixed(2)}
          `);
      });

    // Clean up
    return () => {
      d3.select('body').selectAll('.tooltip').remove();
    };
  }, [data]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Aggregated Forecast Trend (5th, 50th, 95th Percentiles)
      </h3>
      <div className="w-full h-[400px]">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
