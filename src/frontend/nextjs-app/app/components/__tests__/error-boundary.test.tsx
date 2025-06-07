/**
 * Test for ErrorBoundary component
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, UIErrorBoundary, withErrorBoundary } from '../error-boundary';

// Mock the error logger
jest.mock('../../lib/error-logger', () => ({
  errorLogger: {
    logSaveError: jest.fn(),
  },
}));

// Mock the ErrorState component
jest.mock('../../../components/ui/feedback', () => ({
  ErrorState: ({ title, message, action }: { title: string; message: string; action?: { label: string; onClick: () => void } }) => (
    <div data-testid="error-state">
      <h2>{title}</h2>
      <p>{message}</p>
      {action && (
        <button onClick={action.onClick} data-testid="retry-button">
          {action.label}
        </button>
      )}
    </div>
  ),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="working-component">Working!</div>;
};

// Component that conditionally throws error
const ConditionalError = ({ error }: { error?: boolean }) => {
  if (error) {
    throw new Error('Conditional error');
  }
  return <div data-testid="conditional-component">No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console errors during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('working-component')).toBeInTheDocument();
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should allow retry functionality', () => {
    let shouldThrow = true;
    const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Error state should be visible
    expect(screen.getByTestId('error-state')).toBeInTheDocument();

    // Fix the error condition and click retry
    shouldThrow = false;
    fireEvent.click(screen.getByTestId('retry-button'));

    // Re-render after retry click (error boundary should reset)
    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Should show working component
    expect(screen.getByTestId('working-component')).toBeInTheDocument();
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
  });

  it('should reset when resetKeys change', () => {
    let resetKey = 'initial';
    const { rerender } = render(
      <ErrorBoundary resetKeys={[resetKey]}>
        <ConditionalError error={true} />
      </ErrorBoundary>
    );

    // Should show error
    expect(screen.getByTestId('error-state')).toBeInTheDocument();

    // Change reset key and fix error
    resetKey = 'changed';
    rerender(
      <ErrorBoundary resetKeys={[resetKey]}>
        <ConditionalError error={false} />
      </ErrorBoundary>
    );

    // Should show working component
    expect(screen.getByTestId('conditional-component')).toBeInTheDocument();
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should isolate errors when isolate prop is true', () => {
    render(
      <ErrorBoundary isolate={true}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('working-component')).toBeInTheDocument();
    expect(screen.getByTestId('working-component').parentElement).toHaveClass('error-boundary-isolation');
  });
});

describe('UIErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    render(
      <UIErrorBoundary>
        <ThrowError shouldThrow={false} />
      </UIErrorBoundary>
    );

    expect(screen.getByTestId('working-component')).toBeInTheDocument();
  });

  it('should render simplified error UI on error', () => {
    render(
      <UIErrorBoundary>
        <ThrowError shouldThrow={true} />
      </UIErrorBoundary>
    );

    expect(screen.getByText(/This component encountered an error/)).toBeInTheDocument();
    expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={false} />);

    expect(screen.getByTestId('working-component')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
  });

  it('should set correct display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});
