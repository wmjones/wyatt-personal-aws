'use client';

import { useRef, useEffect, useState } from 'react';
import D3Chart from './D3Chart';

interface ResponsiveD3ChartProps {
  parameters: { mean: number; stdDev: number }[];
  onParameterChange?: (index: number, parameter: { mean: number; stdDev: number }) => void;
}

export default function ResponsiveD3Chart({ parameters, onParameterChange }: ResponsiveD3ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const height = Math.min(400, width * 0.5); // Maintain aspect ratio
        setDimensions({ width, height });
      }
    };

    // Initial measurement
    handleResize();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <D3Chart
        parameters={parameters}
        width={dimensions.width}
        height={dimensions.height}
        onParameterChange={onParameterChange}
      />
    </div>
  );
}
