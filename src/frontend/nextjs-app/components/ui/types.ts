/**
 * Shared TypeScript interfaces for UI components
 */

import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// Base component props that all components should extend
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

// Size variants used across multiple components
export type Size = 'sm' | 'md' | 'lg';

// Common variant types
export type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost';

// Status types for feedback components
export type Status = 'success' | 'warning' | 'error' | 'info';

// Button specific props
export interface ButtonProps extends BaseComponentProps, ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Input specific props
export interface InputProps extends BaseComponentProps, InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

// Card specific props
export interface CardProps extends BaseComponentProps, HTMLAttributes<HTMLDivElement> {
  padding?: Size;
  variant?: 'default' | 'elevated';
}

// Loading state props
export interface LoadingStateProps extends BaseComponentProps {
  size?: Size;
  message?: string;
}

// Error state props
export interface ErrorStateProps extends BaseComponentProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Empty state props
export interface EmptyStateProps extends BaseComponentProps {
  title?: string;
  message: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Dropdown base props
export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface BaseDropdownProps extends BaseComponentProps {
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  fullWidth?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
}

// Single select dropdown props
export interface SingleSelectDropdownProps extends BaseDropdownProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

// Multi select dropdown props
export interface MultiSelectDropdownProps extends BaseDropdownProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
}
