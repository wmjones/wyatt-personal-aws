'use client';

import React, { Component, ReactNode } from 'react';
import { ErrorState } from '../../components/ui/feedback';
import { errorLogger } from '../lib/error-logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

/**
 * Error Boundary component that catches JavaScript errors in child components
 * and displays a user-friendly error UI instead of crashing the entire app.
 *
 * Features:
 * - Automatic error logging via errorLogger
 * - Customizable fallback UI
 * - Optional error recovery with reset functionality
 * - Isolation mode to prevent error propagation
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error using the existing error logger
    errorLogger.logSaveError(error, {
      request: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
        timestamp: new Date().toISOString(),
      }
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console for development
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error state if any props change (when resetOnPropsChange is true)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, isolate } = this.props;

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render default error UI using existing ErrorState component
      return (
        <div className="error-boundary-container p-4">
          <ErrorState
            title="Something went wrong"
            message={
              error?.message ||
              "An unexpected error occurred. Please try refreshing the page or contact support if the problem persists."
            }
            action={{
              label: "Try Again",
              onClick: this.handleRetry
            }}
          />
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-gray-100 rounded">
              <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify({
                  error: error?.name,
                  message: error?.message,
                  stack: error?.stack,
                  componentStack: this.state.errorInfo?.componentStack,
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // If isolate is true, wrap children to prevent error propagation
    if (isolate) {
      return (
        <div className="error-boundary-isolation">
          {children}
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook-based wrapper for functional components that need error boundary functionality
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Specialized Error Boundary for UI components that should fail gracefully
 */
export function UIErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">
            This component encountered an error and couldn&apos;t be displayed.
          </p>
        </div>
      }
      isolate={true}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
}
