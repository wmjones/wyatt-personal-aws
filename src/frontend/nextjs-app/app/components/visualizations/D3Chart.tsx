'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface Parameter {
  mean: number;
  stdDev: number;
}

interface D3ChartProps {
  parameters: Parameter[];
  width?: number;
  height?: number;
  onParameterChange?: (index: number, parameter: Parameter) => void;
}

export default function D3Chart({
  parameters,
  width = 600,
  height = 400,
  onParameterChange
}: D3ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !parameters.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous rendering

    // Set up margins and dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([-4, 4]) // Standard normal distribution range
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 0.5]) // Probability density range
      .range([innerHeight, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Create normal distribution function
    const normal = (x: number, mean: number, stdDev: number) => {
      const variance = stdDev * stdDev;
      return (1 / Math.sqrt(2 * Math.PI * variance)) *
        Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
    };

    // Create line generator
    const line = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Draw distributions
    parameters.forEach((param, index) => {
      const data = d3.range(-4, 4.1, 0.1).map(x => ({
        x: x,
        y: normal(x, param.mean, param.stdDev)
      }));

      const color = d3.schemeCategory10[index % 10];

      // Draw the distribution curve
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add area under the curve
      const area = d3.area<{ x: number; y: number }>()
        .x(d => xScale(d.x))
        .y0(innerHeight)
        .y1(d => yScale(d.y))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', color)
        .attr('fill-opacity', 0.2)
        .attr('d', area);

      // Add interactive elements if onParameterChange is provided
      if (onParameterChange) {
        // Add draggable mean indicator
        const meanDrag = d3.drag<SVGCircleElement, unknown>()
          .on('drag', function(event) {
            const newMean = xScale.invert(event.x);
            onParameterChange(index, { ...param, mean: newMean });
          });

        g.append('circle')
          .attr('cx', xScale(param.mean))
          .attr('cy', yScale(normal(param.mean, param.mean, param.stdDev)))
          .attr('r', 6)
          .attr('fill', color)
          .attr('cursor', 'pointer')
          .call(meanDrag);
      }
    });

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 100}, 20)`);

    parameters.forEach((param, index) => {
      const color = d3.schemeCategory10[index % 10];

      legend.append('rect')
        .attr('x', 0)
        .attr('y', index * 20)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', color);

      legend.append('text')
        .attr('x', 24)
        .attr('y', index * 20 + 9)
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .text(`μ=${param.mean.toFixed(2)}, σ=${param.stdDev.toFixed(2)}`);
    });

  }, [parameters, width, height, onParameterChange]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-md shadow-sm"
      />
    </div>
  );
}
