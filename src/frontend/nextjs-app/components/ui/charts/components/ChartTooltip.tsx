import React from 'react';
import { cn } from '../../utils';
import { chartConfig } from '../config';

interface ChartTooltipProps {
  visible: boolean;
  content: React.ReactNode;
  position: { x: number; y: number };
  offset?: { x: number; y: number };
  className?: string;
  'data-testid'?: string;
}

/**
 * ChartTooltip Component
 *
 * A reusable tooltip component for charts that follows the cursor
 * and displays contextual information.
 *
 * @example
 * <ChartTooltip
 *   visible={tooltipVisible}
 *   content={<div>Value: {value}</div>}
 *   position={{ x: mouseX, y: mouseY }}
 * />
 */
export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  visible,
  content,
  position,
  offset = chartConfig.tooltip.offset,
  className,
  'data-testid': testId = 'chart-tooltip',
}) => {
  if (!visible || !content) return null;

  // Calculate position with offset
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x + offset.x}px`,
    top: `${position.y + offset.y}px`,
    pointerEvents: 'none',
    zIndex: 10,
  };

  return (
    <div
      className={cn(
        'bg-dp-surface-primary border border-dp-frame-border',
        'rounded-md shadow-lg',
        'px-3 py-2 text-sm',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={tooltipStyle}
      data-testid={testId}
    >
      {content}
    </div>
  );
};

// Tooltip content builders
export const tooltipBuilders = {
  /**
   * Simple value tooltip
   */
  simple: (label: string, value: number | string, unit?: string) => (
    <div className="space-y-1">
      <div className="font-medium text-dp-text-primary">{label}</div>
      <div className="text-dp-text-secondary">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && ` ${unit}`}
      </div>
    </div>
  ),

  /**
   * Multi-value tooltip
   */
  multiValue: (
    label: string,
    values: Array<{ label: string; value: number | string; color?: string; unit?: string }>
  ) => (
    <div className="space-y-2">
      <div className="font-medium text-dp-text-primary border-b border-dp-frame-divider pb-1">
        {label}
      </div>
      <div className="space-y-1">
        {values.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {item.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-dp-text-secondary">{item.label}:</span>
            </div>
            <span className="font-medium text-dp-text-primary">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              {item.unit && ` ${item.unit}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),

  /**
   * Comparison tooltip
   */
  comparison: (
    label: string,
    current: number,
    previous: number,
    unit?: string
  ) => {
    const diff = current - previous;
    const percentChange = previous !== 0 ? (diff / previous) * 100 : 0;
    const isPositive = diff >= 0;

    return (
      <div className="space-y-2">
        <div className="font-medium text-dp-text-primary">{label}</div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-dp-text-secondary">Current:</span>
            <span className="font-medium">
              {current.toLocaleString()}{unit && ` ${unit}`}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-dp-text-secondary">Previous:</span>
            <span className="font-medium">
              {previous.toLocaleString()}{unit && ` ${unit}`}
            </span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-dp-frame-divider">
            <span className="text-dp-text-secondary">Change:</span>
            <span className={cn(
              'font-medium',
              isPositive ? 'text-dp-ui-positive' : 'text-dp-ui-negative'
            )}>
              {isPositive ? '+' : ''}{diff.toLocaleString()}{unit && ` ${unit}`}
              {' '}({isPositive ? '+' : ''}{percentChange.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    );
  },

  /**
   * Time series tooltip
   */
  timeSeries: (
    date: Date,
    values: Array<{ label: string; value: number; color?: string; unit?: string }>
  ) => (
    <div className="space-y-2">
      <div className="font-medium text-dp-text-primary border-b border-dp-frame-divider pb-1">
        {date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </div>
      <div className="space-y-1">
        {values.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {item.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-dp-text-secondary">{item.label}:</span>
            </div>
            <span className="font-medium text-dp-text-primary">
              {item.value.toLocaleString()}{item.unit && ` ${item.unit}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};
