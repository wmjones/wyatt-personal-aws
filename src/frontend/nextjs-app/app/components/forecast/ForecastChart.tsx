'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DateForecast {
  business_date: string;
  avg_forecast: number;
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

    // Parse dates
    const parsedData = data.map(d => ({
      date: new Date(d.business_date),
      value: d.avg_forecast
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.value) as number * 1.1])
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
      .text('Average Forecast');

    // Define line generator
    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add the line path
    svg.append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', '#4f46e5')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    svg.selectAll('.dot')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', '#4f46e5')
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

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

    // Type assertion to help TypeScript understand the data structure
    type DataPoint = { date: Date; value: number };

    // Add event handlers with proper typing
    svg.selectAll<SVGCircleElement, DataPoint>('.dot')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('r', 6)
          .attr('stroke-width', 2);

        tooltip
          .style('visibility', 'visible')
          .html(`Date: ${d.date.toLocaleDateString()}<br>Forecast: ${d.value.toFixed(2)}`);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 4)
          .attr('stroke-width', 1);

        tooltip.style('visibility', 'hidden');
      });

    // Clean up
    return () => {
      d3.select('body').selectAll('.tooltip').remove();
    };
  }, [data]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Forecast Trend Over Time
      </h3>
      <div className="w-full h-[400px]">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
