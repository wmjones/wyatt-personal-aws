import React from 'react';
import { cn } from '../utils';
import { ButtonProps } from '../types';

/**
 * Button Component
 *
 * A versatile button component with multiple variants and sizes.
 * Supports loading states, icons, and full-width display.
 *
 * @example
 * <Button variant="primary">Save Changes</Button>
 * <Button variant="secondary" size="sm" leftIcon={<Icon />}>Cancel</Button>
 * <Button loading>Processing...</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      'data-testid': testId = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium',
      'rounded-md transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      fullWidth && 'w-full'
    );

    // Variant styles
    const variantStyles = {
      primary: cn(
        'bg-dp-cfa-red text-white',
        'hover:bg-dp-primary-hover',
        'focus:ring-dp-cfa-red',
        'disabled:hover:bg-dp-cfa-red'
      ),
      secondary: cn(
        'bg-white text-dp-text-primary border border-dp-frame-border',
        'hover:bg-dp-background-secondary',
        'focus:ring-dp-cfa-red'
      ),
      tertiary: cn(
        'bg-dp-background-tertiary text-dp-text-primary',
        'hover:bg-dp-frame-border',
        'focus:ring-dp-cfa-red'
      ),
      ghost: cn(
        'bg-transparent text-dp-text-primary',
        'hover:bg-dp-background-secondary',
        'focus:ring-dp-cfa-red'
      ),
    };

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    // Loading spinner
    const loadingSpinner = (
      <svg
        className={cn(
          'animate-spin',
          size === 'sm' && 'h-3 w-3',
          size === 'md' && 'h-4 w-4',
          size === 'lg' && 'h-5 w-5'
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        data-testid={testId}
        {...props}
      >
        {loading ? loadingSpinner : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
