# Color Palette Update

## Overview
This document outlines the color palette updates made to the application, focusing on using red for accents and creating a clean, modern look as requested.

## Primary Palette
The primary palette is taken from `colors.md`:

- **Primary Red**: `#DD0033` (replaced `#E51636`)
- **White**: `#FFFFFF`
- **Dark Red**: `#940929`
- **Navy Blue**: `#004F71`

## Secondary Palette
The secondary palette provides supporting colors:

- **Gray**: `#EEEDEB` (background, secondary elements)
- **Dark Gray**: `#5B6770` (text, subtle elements)

## Color Usage Guidelines

### Primary Applications
- **Red (#DD0033)** is used as the primary accent color for:
  - Active tabs
  - Checkboxes and select elements
  - Primary buttons
  - Focus states and key indicators
  - Forecasted data series
  - Error states

- **White (#FFFFFF)** is used for:
  - Primary background
  - Card backgrounds
  - Text on dark backgrounds

### Secondary Applications
- **Navy Blue (#004F71)** is used for:
  - Secondary accent color
  - Links
  - Supporting UI elements

- **Gray (#EEEDEB)** is used for:
  - Secondary backgrounds
  - Borders and separators
  - Form element backgrounds

- **Dark Gray (#5B6770)** is used for:
  - Secondary text
  - Icons
  - Subtle UI elements

## Technical Implementation

### CSS Variables
The color palette is implemented using CSS variables in the `globals.css` file:

```css
:root {
  --background: #FFFFFF;
  --foreground: #333333;
  --primary: #DD0033;
  --primary-foreground: #FFFFFF;
  --secondary: #EEEDEB;
  /* More color variables... */
}
```

### Tailwind Configuration
The colors are also configured in the Tailwind configuration file:

```js
colors: {
  'dp-cfa-red': '#DD0033',
  'dp-cfa-dark-red': '#940929',
  'dp-cfa-blue': '#004F71',
  'dp-cfa-white': '#FFFFFF',
  'dp-cfa-gray': '#EEEDEB',
  'dp-cfa-dark-gray': '#5b6770',
  /* More color definitions... */
}
```

### Dark Mode Considerations
Dark mode versions of all colors have been added with appropriate contrast adjustments:

```css
.dark {
  --background: #1a1a1a;
  --foreground: #f7f7f7;
  --primary: #DD0033;
  /* More dark mode colors... */
}
```

## Chart Colors
The chart colors have been updated to ensure consistency with the brand palette while maintaining good contrast and visual distinction:

- **Forecasted**: Primary red (#DD0033)
- **Edited**: Gold/Yellow (#EAB308)
- **Actual**: Blue (#3B82F6)
- **2024 Actual**: Amber/Orange (#F59E0B)
- **2023 Actual**: Green (#65A30D)

## Updates Made
The following components were updated to use the new color palette:

1. Tailwind configuration
2. Global CSS variables
3. Chart components (TimeSeriesChart)
4. Header and TabNavigation components
5. Toggles and UI controls in ForecastCharts

## Accessibility Considerations
- All colors maintain appropriate contrast ratios for text and interactive elements
- The primary red is used sparingly to highlight key elements
- The color system is implemented consistently across the application
- Dark mode colors are adjusted to maintain good readability
