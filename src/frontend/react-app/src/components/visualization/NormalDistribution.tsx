import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface NormalDistributionProps {
  mean?: number;
  stdDev?: number;
  width?: number;
  height?: number;
  updatedBy?: string;
}

const NormalDistribution: React.FC<NormalDistributionProps> = ({
  mean = 0,
  stdDev = 1,
  width = 600,
  height = 300,
  updatedBy = 'System'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [lastUpdatedBy, setLastUpdatedBy] = useState(updatedBy);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; value: number } | null>(null);

  // Function to calculate normal distribution PDF
  const normalPDF = useCallback((x: number, mean: number, stdDev: number) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
           Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  }, []);

  // Generate data points
  const generateDistributionData = useCallback((mean: number, stdDev: number) => {
    const data = [];
    // Increase the range and density of points for smoother curve
    for (let x = mean - 5 * stdDev; x <= mean + 5 * stdDev; x += 0.05) {
      data.push({
        x: x,
        y: normalPDF(x, mean, stdDev)
      });
    }
    return data;
  }, [normalPDF]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Update state
    setLastUpdatedBy(updatedBy);

    // Set up D3.js visualization
    const margin = { top: 30, right: 40, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Remove any existing SVG elements
    d3.select(svgRef.current).selectAll("*").remove();

    // Create the SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate the domain for x based on mean and stdDev
    const xDomain = [mean - 4 * stdDev, mean + 4 * stdDev];

    // X axis
    const x = d3.scaleLinear()
      .domain(xDomain)
      .range([0, innerWidth]);

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));

    // Add X axis label
    svg.append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .style("fill", "var(--text-color)")
      .text("Value");

    // Calculate max Y value for scaling
    const maxY = normalPDF(mean, mean, stdDev) * 1.1; // 10% higher than peak

    // Y axis
    const y = d3.scaleLinear()
      .domain([0, maxY])
      .range([innerHeight, 0]);

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));

    // Add Y axis label
    svg.append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .style("fill", "var(--text-color)")
      .text("Probability Density");

    // Create the line generator
    const line = d3.line<{x: number, y: number}>()
      .x(d => x(d.x))
      .y(d => y(d.y))
      .curve(d3.curveBasis);

    // Add area fill under the curve
    const area = d3.area<{x: number, y: number}>()
      .x(d => x(d.x))
      .y0(innerHeight)
      .y1(d => y(d.y))
      .curve(d3.curveBasis);

    // Add the area with light fill
    svg.append("path")
      .datum(generateDistributionData(mean, stdDev))
      .attr("id", "distribution-area")
      .attr("fill", "var(--primary-color)")
      .attr("fill-opacity", 0.2)
      .attr("d", area);

    // Add the path with a unique ID
    const path = svg.append("path")
      .datum(generateDistributionData(mean, stdDev))
      .attr("id", "distribution-curve")
      .attr("fill", "none")
      .attr("stroke", "var(--primary-color)")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Calculate total length for transition
    const pathLength = path.node()?.getTotalLength() || 0;

    // Set up the initial state for the path transition
    path.attr("stroke-dasharray", `${pathLength} ${pathLength}`)
      .attr("stroke-dashoffset", pathLength)
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // Add grid lines
    svg.append("g")
      .attr("class", "grid-lines")
      .attr("opacity", 0.2)
      .selectAll(".grid-line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "var(--text-color)");

    // Add a vertical line at the mean
    svg.append("line")
      .attr("id", "mean-line")
      .attr("x1", x(mean))
      .attr("x2", x(mean))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "var(--primary-dark)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // Add mean label with a background for better visibility
    const meanLabel = svg.append("g")
      .attr("id", "mean-label-group")
      .attr("transform", `translate(${x(mean)}, ${innerHeight + 30})`);

    meanLabel.append("rect")
      .attr("x", -50)
      .attr("y", -15)
      .attr("width", 100)
      .attr("height", 20)
      .attr("fill", "white")
      .attr("fill-opacity", 0.7)
      .attr("rx", 3);

    meanLabel.append("text")
      .attr("id", "mean-label")
      .attr("text-anchor", "middle")
      .attr("y", 0)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "var(--primary-dark)")
      .text(`μ = ${mean.toFixed(1)}, σ = ${stdDev.toFixed(1)}`);

    // Add standard deviation ranges (μ±σ, μ±2σ, μ±3σ)
    const stdDevRanges = [
      { range: 1, opacity: 0.3, label: "68.2%" },
      { range: 2, opacity: 0.2, label: "95.4%" },
      { range: 3, opacity: 0.1, label: "99.7%" }
    ];

    // Add std dev ranges
    stdDevRanges.forEach(({ range, opacity, label }) => {
      // Add rectangle for each standard deviation range
      svg.append("rect")
        .attr("id", `std-dev-range-${range}`)
        .attr("x", x(mean - range * stdDev))
        .attr("width", x(mean + range * stdDev) - x(mean - range * stdDev))
        .attr("y", 0)
        .attr("height", innerHeight)
        .attr("fill", "var(--primary-color)")
        .attr("opacity", opacity);

      // Add label for each range at the top
      svg.append("text")
        .attr("id", `std-dev-label-${range}`)
        .attr("text-anchor", "middle")
        .attr("x", x(mean))
        .attr("y", -5 - (range - 1) * 15)
        .style("font-size", "10px")
        .style("fill", "var(--primary-dark)")
        .text(`μ±${range}σ: ${label}`);
    });

    // Add hover effect - transparent overlay for mouse detection
    const overlay = svg.append("rect")
      .attr("class", "overlay")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all");

    // Add tooltip element
    const tooltip = svg.append("g")
      .attr("class", "tooltip")
      .style("opacity", 0);

    tooltip.append("rect")
      .attr("width", 120)
      .attr("height", 50)
      .attr("fill", "white")
      .attr("stroke", "var(--primary-color)")
      .attr("rx", 4)
      .attr("opacity", 0.9);

    const tooltipText = tooltip.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .style("font-size", "12px")
      .style("fill", "var(--text-color)");

    tooltipText.append("tspan")
      .attr("class", "tooltip-x")
      .attr("x", 10)
      .attr("dy", 0);

    tooltipText.append("tspan")
      .attr("class", "tooltip-y")
      .attr("x", 10)
      .attr("dy", 20);

    // Hover tracking point
    const hoverPoint = svg.append("circle")
      .attr("r", 5)
      .attr("fill", "var(--primary-dark)")
      .style("opacity", 0);

    // Mouse move handler for tooltip
    overlay.on("mousemove", function(event) {
      const [mouseX, mouseY] = d3.pointer(event);
      const xValue = x.invert(mouseX);
      const yValue = normalPDF(xValue, mean, stdDev);

      // Convert to screen coordinates
      const screenY = y(yValue);

      // Only show tooltip when mouse is near the curve
      const distanceThreshold = 20; // px
      const distanceToPoint = Math.abs(screenY - mouseY);

      if (distanceToPoint < distanceThreshold) {
        // Update hover info for React state
        setHoverInfo({ x: xValue, y: yValue, value: yValue });

        // Position the hover point
        hoverPoint
          .attr("cx", mouseX)
          .attr("cy", screenY)
          .style("opacity", 1);

        // Show and position tooltip
        tooltip
          .style("opacity", 1)
          .attr("transform", `translate(${mouseX + 10}, ${screenY - 30})`);

        // Update tooltip text
        tooltip.select(".tooltip-x")
          .text(`Value: ${xValue.toFixed(2)}`);

        tooltip.select(".tooltip-y")
          .text(`Density: ${yValue.toFixed(4)}`);
      } else {
        // Hide tooltip and point if too far from curve
        tooltip.style("opacity", 0);
        hoverPoint.style("opacity", 0);
        setHoverInfo(null);
      }
    });

    // Mouse leave handler
    overlay.on("mouseleave", function() {
      tooltip.style("opacity", 0);
      hoverPoint.style("opacity", 0);
      setHoverInfo(null);
    });

  }, [mean, stdDev, updatedBy, width, height, normalPDF, generateDistributionData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: `${width}px` }}>
        <svg
          ref={svgRef}
          className="chart"
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: `${width}px`,
            aspectRatio: `${width}/${height}`
          }}
        />
        {hoverInfo && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid var(--primary-color)'
          }}>
            <div>Value: {hoverInfo.x.toFixed(2)}</div>
            <div>Density: {hoverInfo.y.toFixed(4)}</div>
          </div>
        )}
      </div>
      <p style={{ fontStyle: 'italic', color: '#666', fontSize: '0.9em', marginTop: '5px' }}>
        Last updated by: {lastUpdatedBy}
      </p>
    </div>
  );
};

export default NormalDistribution;
