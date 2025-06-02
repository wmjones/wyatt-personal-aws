import React from 'react';
import { cn } from '../utils';
import { CardProps } from '../types';

/**
 * Card Component
 *
 * A flexible container component for grouping related content.
 * Supports different padding sizes and elevation variants.
 *
 * @example
 * <Card>Basic card content</Card>
 * <Card variant="elevated" padding="lg">
 *   <h2>Card Title</h2>
 *   <p>Card content with larger padding</p>
 * </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      className,
      children,
      'data-testid': testId = 'card',
      ...props
    },
    ref
  ) => {
    const paddingStyles = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const variantStyles = {
      default: cn(
        'bg-dp-surface-primary',
        'border border-dp-frame-border'
      ),
      elevated: cn(
        'bg-dp-surface-elevated',
        'shadow-md'
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg',
          paddingStyles[padding],
          variantStyles[variant],
          className
        )}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
