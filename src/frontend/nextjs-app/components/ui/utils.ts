/**
 * Utility functions for UI components
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with proper Tailwind CSS conflict resolution
 * @param inputs - Class names to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number with locale-specific formatting
 * @param value - Number to format
 * @param options - Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

/**
 * Formats a date with locale-specific formatting
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Generates a unique ID for form elements
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix = 'ui'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounces a function call
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array)
 * @param value - Value to check
 * @returns True if empty
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length === 0;
  return false;
}

/**
 * Filters an array of options based on a search query
 * @param options - Array of options with label property
 * @param query - Search query
 * @returns Filtered options
 */
export function filterOptions<T extends { label: string }>(
  options: T[],
  query: string
): T[] {
  if (!query) return options;

  const normalizedQuery = query.toLowerCase().trim();
  return options.filter(option =>
    option.label.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Groups an array of items by a key
 * @param items - Array of items
 * @param key - Key to group by
 * @returns Grouped object
 */
export function groupBy<T>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  return items.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Handles keyboard navigation for dropdown/list components
 * @param event - Keyboard event
 * @param currentIndex - Current selected index
 * @param maxIndex - Maximum index (length - 1)
 * @param onSelect - Callback when item is selected
 * @returns New index or undefined if not handled
 */
export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  maxIndex: number,
  onSelect?: (index: number) => void
): number | undefined {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      return Math.min(currentIndex + 1, maxIndex);

    case 'ArrowUp':
      event.preventDefault();
      return Math.max(currentIndex - 1, 0);

    case 'Home':
      event.preventDefault();
      return 0;

    case 'End':
      event.preventDefault();
      return maxIndex;

    case 'Enter':
    case ' ':
      event.preventDefault();
      if (onSelect && currentIndex >= 0) {
        onSelect(currentIndex);
      }
      return currentIndex;

    default:
      return undefined;
  }
}
