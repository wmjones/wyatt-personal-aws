'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

export interface BaseChartProps {
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  className?: string;
}

export default function BaseChart({
  width = 600,
  height = 400,
  // margin is defined but used in derived charts
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  margin = { top: 20, right: 30, bottom: 40, left: 50 },
  className = ''
}: BaseChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
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
  
  // Helper functions for tooltip - used by child components
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showTooltip = (content: string, x: number, y: number) => {
    setTooltipContent(content);
    setTooltipPosition({ x, y });
    setTooltipVisible(true);
  };
  
  // Helper function to hide tooltip
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hideTooltip = () => {
    setTooltipVisible(false);
  };
  
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