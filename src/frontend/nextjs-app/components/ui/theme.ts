/**
 * Design System Theme Configuration
 *
 * This file contains all design tokens used throughout the application.
 * It provides a single source of truth for colors, spacing, typography, etc.
 */

export const theme = {
  colors: {
    // Demand Planning Color Palette
    dp: {
      // Primary Colors
      primary: '#e83b45', // CFA Red
      primaryHover: '#d6333c',
      primaryLight: '#fef2f2',

      // Text Colors
      text: {
        primary: '#111827',    // gray-900
        secondary: '#4b5563',  // gray-600
        tertiary: '#9ca3af',   // gray-400
        inverse: '#ffffff',
      },

      // Background Colors
      background: {
        primary: '#ffffff',
        secondary: '#f9fafb',   // gray-50
        tertiary: '#f3f4f6',    // gray-100
        elevated: '#ffffff',
      },

      // Surface Colors (for cards, modals, etc)
      surface: {
        primary: '#ffffff',
        secondary: '#f9fafb',   // gray-50
        elevated: '#ffffff',
      },

      // Frame/Border Colors
      frame: {
        border: '#e5e7eb',      // gray-300
        divider: '#f3f4f6',     // gray-100
      },

      // Status Colors
      status: {
        success: '#10b981',     // green-500
        warning: '#f59e0b',     // amber-500
        error: '#ef4444',       // red-500
        info: '#3b82f6',        // blue-500
      },
    },
  },

  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  typography: {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  transitions: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
    },
    easing: {
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  zIndex: {
    dropdown: 1000,
    modal: 1050,
    popover: 1100,
    tooltip: 1150,
  },
} as const;

export type Theme = typeof theme;
