/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Demand Planning Dashboard - Chick-fil-A colors
        'dp-cfa-red': '#E51636',
        'dp-cfa-blue': '#004F71',
        'dp-cfa-red-bright': '#E4002B',

        // Background colors
        'dp-bg-primary': '#F5F5F7',
        'dp-bg-secondary': '#FFFFFF',
        'dp-bg-tertiary': '#E8E8ED',

        // Text colors
        'dp-text-primary': '#1D1D1F',
        'dp-text-secondary': '#86868B',
        'dp-text-tertiary': '#6E6E73',
        'dp-text-disabled': '#AEAEB2',

        // UI colors
        'dp-ui-positive': '#34C759',
        'dp-ui-negative': '#FF3B30',
        'dp-ui-neutral': '#9CA3AF',
        'dp-ui-highlight': '#007AFF',
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
