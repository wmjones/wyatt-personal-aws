'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export interface BaseChartProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function BaseChart({
  width = 600,
  height = 400,
  className = ''
}: BaseChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Create a resize observer to handle responsive behavior
  useEffect(() => {
    const svg = d3.select(svgRef.current);

    // Function to handle resize events
    const handleResize = () => {
      // This is a placeholder - specific chart implementations will override this
      svg.attr('width', width).attr('height', height);
    };

    // Initialize size
    handleResize();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    if (svgRef.current) {
      resizeObserver.observe(svgRef.current.parentElement as Element);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height]);


  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="max-w-full bg-dp-surface-primary rounded-lg border border-dp-border-light"
      >
        {/* Chart contents will be rendered by specific implementations */}
      </svg>

    </div>
  );
}
