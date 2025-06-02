import React from 'react';
import { cn } from '../utils';
import { EmptyStateProps } from '../types';

/**
 * EmptyState Component
 *
 * A consistent empty state display used when no data is available.
 * Includes customizable icon, title, message, and optional action.
 *
 * @example
 * <EmptyState message="No data available" />
 * <EmptyState
 *   title="No results found"
 *   message="Try adjusting your filters"
 *   action={{ label: "Clear filters", onClick: handleClear }}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data',
  message,
  icon,
  action,
  className,
  'data-testid': testId = 'empty-state',
}) => {
  const defaultIcon = (
    <svg
      className="h-12 w-12 text-dp-text-tertiary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div
      className={cn(
        'bg-dp-background-secondary rounded-lg p-8',
        'flex flex-col items-center text-center',
        className
      )}
      data-testid={testId}
    >
      <div className="mb-4">
        {icon || defaultIcon}
      </div>

      <h3 className="text-lg font-medium text-dp-text-primary mb-2">
        {title}
      </h3>

      <p className="text-dp-text-secondary mb-6 max-w-sm">
        {message}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'px-4 py-2 bg-dp-cfa-red text-white rounded-md',
            'hover:bg-dp-primary-hover focus:outline-none focus:ring-2',
            'focus:ring-dp-cfa-red focus:ring-offset-2',
            'transition-colors duration-200'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
