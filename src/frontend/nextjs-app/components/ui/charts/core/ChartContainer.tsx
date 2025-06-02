import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../utils';
import { LoadingState, ErrorState } from '../../feedback';
import { ChartContainerProps, ChartDimensions } from '../types';
import { chartConfig } from '../config';

/**
 * ChartContainer Component
 *
 * A wrapper component that provides responsive dimensions, loading states,
 * error handling, and empty states for chart components.
 *
 * @example
 * <ChartContainer loading={isLoading} error={error}>
 *   {({ innerWidth, innerHeight }) => (
 *     <LineChart width={innerWidth} height={innerHeight} data={data} />
 *   )}
 * </ChartContainer>
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  width: providedWidth,
  height: providedHeight = 400,
  margin = chartConfig.margins.default,
  minHeight = 300,
  aspectRatio,
  loading = false,
  error,
  // emptyMessage = 'No data available',
  className,
  children,
  'data-testid': testId = 'chart-container',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: providedWidth || 0,
    height: providedHeight,
    innerWidth: 0,
    innerHeight: 0,
    margin,
  });

  // Handle responsive sizing
  useEffect(() => {
    if (providedWidth) return; // Skip if width is provided

    const updateDimensions = () => {
      if (!containerRef.current) return;

      const { width } = containerRef.current.getBoundingClientRect();
      let calculatedHeight = providedHeight;

      // Apply aspect ratio if provided
      if (aspectRatio) {
        calculatedHeight = width / aspectRatio;
      }

      // Ensure minimum height
      calculatedHeight = Math.max(calculatedHeight, minHeight);

      setDimensions({
        width,
        height: calculatedHeight,
        innerWidth: Math.max(0, width - margin.left - margin.right),
        innerHeight: Math.max(0, calculatedHeight - margin.top - margin.bottom),
        margin,
      });
    };

    // Initial measurement
    updateDimensions();

    // Setup ResizeObserver
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [providedWidth, providedHeight, aspectRatio, minHeight, margin]);

  // Update dimensions when margin changes
  useEffect(() => {
    if (dimensions.width > 0) {
      setDimensions(prev => ({
        ...prev,
        innerWidth: Math.max(0, prev.width - margin.left - margin.right),
        innerHeight: Math.max(0, prev.height - margin.top - margin.bottom),
        margin,
      }));
    }
  }, [margin, dimensions.width]);

  // Render states
  if (loading) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'bg-dp-chart-background rounded-lg border border-dp-frame-border',
          'flex items-center justify-center',
          className
        )}
        style={{ minHeight: `${minHeight}px`, height: providedHeight }}
        data-testid={testId}
      >
        <LoadingState size="md" message="Loading chart data..." />
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div
        ref={containerRef}
        className={cn(
          'bg-dp-chart-background rounded-lg border border-dp-frame-border',
          'flex items-center justify-center p-8',
          className
        )}
        style={{ minHeight: `${minHeight}px`, height: providedHeight }}
        data-testid={testId}
      >
        <ErrorState
          title="Chart Error"
          message={errorMessage}
        />
      </div>
    );
  }

  // Don't render until we have dimensions
  if (!dimensions.width || dimensions.innerWidth <= 0 || dimensions.innerHeight <= 0) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'bg-dp-chart-background rounded-lg border border-dp-frame-border',
          className
        )}
        style={{ minHeight: `${minHeight}px`, height: providedHeight }}
        data-testid={testId}
      >
        {!providedWidth && <div className="w-full h-full" />}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'bg-dp-chart-background rounded-lg border border-dp-frame-border',
        'relative',
        className
      )}
      style={{
        minHeight: `${minHeight}px`,
        height: dimensions.height,
        width: providedWidth
      }}
      data-testid={testId}
    >
      {children(dimensions)}
    </div>
  );
};
