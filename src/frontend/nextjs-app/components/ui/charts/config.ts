/**
 * Chart Configuration
 *
 * Centralized configuration for all chart components including
 * colors, margins, animations, and other display settings.
 */

export const chartConfig = {
  // Color palette from design system
  colors: {
    primary: 'var(--dp-chart-forecasted)',
    secondary: 'var(--dp-chart-actual)',
    tertiary: 'var(--dp-chart-edited)',
    success: 'var(--dp-ui-positive)',
    error: 'var(--dp-ui-negative)',
    warning: 'var(--dp-chart-edited)',

    // Specific chart elements
    grid: 'var(--dp-chart-grid)',
    axis: 'var(--dp-chart-axis-text)',
    background: 'var(--dp-chart-background)',

    // Historical data colors
    historical: {
      2023: 'var(--dp-chart-actual-2023)',
      2024: 'var(--dp-chart-actual-2024)',
    },

    // Confidence intervals
    confidence: {
      fill: 'rgba(59, 130, 246, 0.1)', // blue with low opacity
      stroke: 'rgba(59, 130, 246, 0.3)',
    },
  },

  // Default dimensions
  defaultWidth: 800,
  defaultHeight: 400,

  // Standard margins for different chart types
  margins: {
    default: { top: 20, right: 30, bottom: 50, left: 60 },
    compact: { top: 10, right: 20, bottom: 30, left: 40 },
    withLegend: { top: 40, right: 30, bottom: 50, left: 60 },
    withBrush: { top: 20, right: 30, bottom: 100, left: 60 },
  },

  // Convenience accessor for default margin
  get margin() {
    return this.margins.default;
  },

  // Animation settings
  animations: {
    duration: 300,
    easing: 'easeOutCubic',
    stagger: 50,
  },

  // Axis configuration
  axis: {
    x: {
      tickPadding: 8,
      tickSize: 6,
      labelRotation: -45,
      format: {
        date: '%b %d',
        month: '%b %Y',
        year: '%Y',
      },
    },
    y: {
      tickPadding: 8,
      tickSize: 6,
      tickCount: 6,
      format: {
        number: ',.0f',
        currency: '$,.0f',
        percent: '.0%',
      },
    },
  },

  // Grid configuration
  grid: {
    strokeDasharray: '3,3',
    opacity: 0.3,
    showVertical: false,
    showHorizontal: true,
  },

  // Tooltip configuration
  tooltip: {
    offset: { x: 10, y: -10 },
    padding: 12,
    borderRadius: 6,
    fontSize: 14,
    maxWidth: 250,
  },

  // Legend configuration
  legend: {
    itemSpacing: 20,
    iconSize: 12,
    fontSize: 14,
    position: 'top-right' as const,
  },

  // Responsive breakpoints
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },

  // Chart-specific configurations
  lineChart: {
    strokeWidth: 2,
    dotRadius: 4,
    activeDotRadius: 6,
    curveType: 'curveMonotoneX',
  },

  barChart: {
    barPadding: 0.1,
    groupPadding: 0.2,
    cornerRadius: 4,
  },

  areaChart: {
    fillOpacity: 0.3,
    strokeWidth: 2,
  },
} as const;

export type ChartConfig = typeof chartConfig;
