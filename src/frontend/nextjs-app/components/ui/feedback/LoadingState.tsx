import React from 'react';
import { cn } from '../utils';
import { LoadingStateProps } from '../types';

/**
 * LoadingState Component
 *
 * A consistent loading indicator used throughout the application.
 * Supports different sizes and optional loading messages.
 *
 * @example
 * <LoadingState />
 * <LoadingState size="lg" message="Loading forecast data..." />
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'md',
  message = 'Loading...',
  className,
  'data-testid': testId = 'loading-state',
}) => {
  const sizeClasses = {
    sm: {
      spinner: 'h-8 w-8',
      text: 'text-sm',
      container: 'p-4',
    },
    md: {
      spinner: 'h-12 w-12',
      text: 'text-base',
      container: 'p-8',
    },
    lg: {
      spinner: 'h-16 w-16',
      text: 'text-lg',
      container: 'p-12',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'bg-dp-background-tertiary rounded-lg',
        classes.container,
        className
      )}
      data-testid={testId}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-b-2 border-dp-cfa-red mb-4',
          classes.spinner
        )}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className={cn('text-dp-text-tertiary', classes.text)}>
          {message}
        </p>
      )}
    </div>
  );
};
