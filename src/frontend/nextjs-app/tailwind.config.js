/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: false, // Disable dark mode completely
  theme: {
    extend: {
      colors: {
        // Demand Planning Dashboard - Primary palette from colors.md
        'dp-cfa-red': '#DD0033',
        'dp-cfa-dark-red': '#940929',
        'dp-cfa-blue': '#004F71',
        'dp-cfa-white': '#FFFFFF',

        // Secondary palette from colors.md
        'dp-cfa-gray': '#EEEDEB',
        'dp-cfa-dark-gray': '#5b6770',

        // Background colors - updated with new palette colors
        'dp-bg-primary': '#FFFFFF',
        'dp-bg-secondary': '#EEEDEB',
        'dp-bg-tertiary': '#F7F7F6',

        // Text colors - updated with clean modern style
        'dp-text-primary': '#333333',
        'dp-text-secondary': '#5b6770',
        'dp-text-tertiary': '#6E6E73',
        'dp-text-disabled': '#AEAEB2',

        // UI colors - updated with new primary red
        'dp-ui-positive': '#34C759',
        'dp-ui-negative': '#DD0033',
        'dp-ui-neutral': '#5b6770',
        'dp-ui-highlight': '#DD0033',

        // Chart specific colors from CSS variables
        'dp-chart-background': 'var(--dp-chart-background)',
        'dp-frame-border': 'var(--dp-frame-border)',
      },
      boxShadow: {
        'dp-light': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'dp-medium': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'dp-heavy': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['SF Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        // Typography scale from design requirements
        'display': ['32px', { lineHeight: '40px', fontWeight: '700' }], // Chart titles only
        'heading': ['20px', { lineHeight: '28px', fontWeight: '600' }], // Section headers
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }], // Primary content
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }], // Metadata, timestamps
        'micro': ['11px', { lineHeight: '14px', fontWeight: '500' }], // Labels, tags
      },
      fontWeight: {
        'regular': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      spacing: {
        // 8px base unit spacing system
        '0': '0',
        '1': '8px',    // 8px - micro
        '2': '16px',   // 16px - small
        '3': '24px',   // 24px - medium
        '4': '32px',   // 32px - large
        '5': '40px',   // 40px
        '6': '48px',   // 48px - extra large
        '8': '64px',   // 64px
        '10': '80px',  // 80px
        '12': '96px',  // 96px
        '16': '128px', // 128px
        '20': '160px', // 160px
        '24': '192px', // 192px
        // Additional specific spacing
        'dp-xs': '4px',   // 4px - internal component spacing
        'dp-sm': '8px',   // 8px - related elements
        'dp-md': '16px',  // 16px - component padding
        'dp-lg': '24px',  // 24px - section spacing
        'dp-xl': '32px',  // 32px - major sections
        'dp-2xl': '48px', // 48px - page-level spacing
      },
      borderRadius: {
        'none': '0',
        'sm': '6px',    // Small components
        'DEFAULT': '8px', // Medium components
        'lg': '12px',   // Large components
        'xl': '16px',   // Extra large
        'full': '9999px', // Pills/circles
      },
    },
  },
  plugins: [],
};
