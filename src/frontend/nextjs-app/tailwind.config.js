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
        'dp-sans': [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
        ],
      },
      borderRadius: {
        'dp-sm': '4px',
        'dp-md': '8px',
        'dp-lg': '12px',
        'dp-xl': '16px',
      },
    },
  },
  plugins: [],
};
