import React from 'react';
import { cn } from '../utils';
import { ErrorStateProps } from '../types';

/**
 * ErrorState Component
 *
 * A consistent error display component used throughout the application.
 * Includes an error icon, title, message, and optional action button.
 *
 * @example
 * <ErrorState message="Failed to load data" />
 * <ErrorState
 *   title="Something went wrong"
 *   message="Unable to fetch forecast data"
 *   action={{ label: "Retry", onClick: handleRetry }}
 * />
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error',
  message,
  action,
  className,
  'data-testid': testId = 'error-state',
}) => {
  return (
    <div
      className={cn(
        'bg-red-50 border border-red-200 rounded-lg p-6',
        'flex flex-col items-center text-center',
        className
      )}
      data-testid={testId}
      role="alert"
    >
      <svg
        className="h-12 w-12 text-red-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>

      <h3 className="text-lg font-semibold text-red-800 mb-2">
        {title}
      </h3>

      <p className="text-red-700 mb-4">
        {message}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'px-4 py-2 bg-red-600 text-white rounded-md',
            'hover:bg-red-700 focus:outline-none focus:ring-2',
            'focus:ring-red-500 focus:ring-offset-2',
            'transition-colors duration-200'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
