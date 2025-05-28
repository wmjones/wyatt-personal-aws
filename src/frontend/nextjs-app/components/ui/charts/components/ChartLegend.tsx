import React from 'react';
import { cn } from '../../utils';
// import { chartConfig } from '../config';
import { LegendConfig, LegendItem } from '../types';

interface ChartLegendProps extends LegendConfig {
  className?: string;
  onItemClick?: (item: LegendItem, index: number) => void;
  activeItems?: string[];
}

/**
 * ChartLegend Component
 *
 * A flexible legend component for charts that supports various
 * positions and interactive features.
 *
 * @example
 * <ChartLegend
 *   items={[
 *     { label: 'Actual', color: 'blue', shape: 'circle' },
 *     { label: 'Forecast', color: 'red', shape: 'line' }
 *   ]}
 *   position="top-right"
 * />
 */
export const ChartLegend: React.FC<ChartLegendProps> = ({
  show = true,
  position = 'top-right',
  items = [],
  className,
  onItemClick,
  activeItems,
}) => {
  if (!show || items.length === 0) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top': 'top-4 left-1/2 -translate-x-1/2',
    'bottom': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const isHorizontal = position === 'top' || position === 'bottom';

  return (
    <div
      className={cn(
        'absolute z-10',
        'bg-dp-surface-primary/95 backdrop-blur-sm',
        'border border-dp-frame-border rounded-md',
        'px-3 py-2',
        positionClasses[position],
        className
      )}
    >
      <div
        className={cn(
          'flex gap-4',
          isHorizontal ? 'flex-row' : 'flex-col'
        )}
      >
        {items.map((item, index) => {
          const isActive = !activeItems || activeItems.includes(item.label);
          const isClickable = !!onItemClick;

          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2',
                isClickable && 'cursor-pointer hover:opacity-80',
                !isActive && 'opacity-40'
              )}
              onClick={() => isClickable && onItemClick(item, index)}
            >
              {/* Legend marker */}
              {item.shape === 'line' ? (
                <svg width="20" height="12" className="flex-shrink-0">
                  <line
                    x1="0"
                    y1="6"
                    x2="20"
                    y2="6"
                    stroke={item.color}
                    strokeWidth="2"
                    strokeDasharray={item.strokeDasharray}
                  />
                </svg>
              ) : item.shape === 'square' ? (
                <div
                  className="w-3 h-3 flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              ) : (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              )}

              {/* Label */}
              <span className="text-sm text-dp-text-primary whitespace-nowrap">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
