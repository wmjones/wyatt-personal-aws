'use client';

import { useRef, useState, useEffect } from 'react';

interface ResponsiveChartWrapperProps {
  children: (width: number, height: number) => React.ReactNode;
  aspectRatio?: number;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

export default function ResponsiveChartWrapper({
  children,
  aspectRatio = 16 / 9,
  minHeight = 300,
  maxHeight = 600,
  className = ''
}: ResponsiveChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;

    const currentContainer = containerRef.current;

    const updateDimensions = () => {
      if (currentContainer) {
        const width = currentContainer.clientWidth;
        let height = width / aspectRatio;

        // Enforce min/max height constraints
        height = Math.max(minHeight, Math.min(maxHeight, height));

        setDimensions({ width, height });
      }
    };

    // Initial update
    updateDimensions();

    // Create resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(currentContainer);

    // Clean up
    return () => {
      resizeObserver.unobserve(currentContainer);
    };
  }, [aspectRatio, minHeight, maxHeight]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      style={{
        height: dimensions.height,
        minHeight: minHeight,
        maxHeight: maxHeight
      }}
    >
      {children(dimensions.width, dimensions.height)}
    </div>
  );
}
