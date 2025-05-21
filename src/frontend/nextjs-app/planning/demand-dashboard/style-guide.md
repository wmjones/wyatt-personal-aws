# Demand Planning Dashboard Style Guide

This style guide defines the visual design system for the Demand Planning Dashboard, following an Apple OSX aesthetic with Chick-fil-A colors.

## Color Palette

### Brand Colors

```css
--cfa-red: #E51636;        /* Chick-fil-A Primary Red */
--cfa-blue: #004F71;       /* Chick-fil-A Blue */
--cfa-red-bright: #E4002B; /* Chick-fil-A Bright Red */
```

### UI Colors

```css
--background-primary: #F5F5F7;   /* Light Gray (Apple-like) */
--background-secondary: #FFFFFF; /* White */
--background-tertiary: #E8E8ED;  /* Light Gray for alternating rows */

--surface-primary: #FFFFFF;      /* White */
--surface-secondary: rgba(255, 255, 255, 0.8); /* Translucent White */
--surface-tertiary: rgba(242, 242, 247, 0.9);  /* Translucent Light Gray */

--border-light: #D2D2D7;         /* Light Gray (Apple-like) */
--border-medium: #C7C7CC;        /* Medium Gray (Apple-like) */
--border-focus: #0071E3;         /* Focus Blue (Apple-like) */

--shadow-light: 0 2px 8px rgba(0, 0, 0, 0.05);  /* Subtle shadow */
--shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.08); /* Medium shadow */
--shadow-heavy: 0 8px 24px rgba(0, 0, 0, 0.12);  /* Heavier shadow */
```

### Text Colors

```css
--text-primary: #1D1D1F;    /* Almost Black (Apple-like) */
--text-secondary: #86868B;  /* Medium Gray (Apple-like) */
--text-tertiary: #6E6E73;   /* Darker Gray (Apple-like) */
--text-disabled: #AEAEB2;   /* Light Gray (Apple-like) */

--text-inverse: #FFFFFF;    /* White text for dark backgrounds */
--text-brand: var(--cfa-red); /* Chick-fil-A Red for brand elements */
--text-error: #FF3B30;      /* Error Red (Apple-like) */
--text-success: #34C759;    /* Success Green (Apple-like) */
--text-warning: #FF9500;    /* Warning Orange (Apple-like) */
```

### Functional Colors

```css
--action-primary: var(--cfa-red);    /* Primary action color */
--action-secondary: var(--cfa-blue); /* Secondary action color */
--action-tertiary: #8A8A8E;          /* Tertiary action color */

--ui-positive: #34C759;    /* Positive change */
--ui-negative: #FF3B30;    /* Negative change */
--ui-neutral: #9CA3AF;     /* Neutral change */
--ui-highlight: #007AFF;   /* Highlight color */
```

## Typography

### Font Family

```css
--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji";
```

### Font Weights

```css
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Font Sizes

```css
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem;  /* 36px */
```

### Line Heights

```css
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Text Styles

#### Headings

```css
h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-light);
  letter-spacing: -0.025em;
  color: var(--text-primary);
}

h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-regular);
  letter-spacing: -0.0125em;
  color: var(--text-primary);
}

h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}
```

#### Body Text

```css
.text-body {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
}

.text-body-small {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
}

.text-caption {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  color: var(--text-secondary);
}
```

## Spacing

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.5rem;   /* 24px */
--space-6: 2rem;     /* 32px */
--space-8: 3rem;     /* 48px */
--space-10: 4rem;    /* 64px */
--space-12: 6rem;    /* 96px */
--space-16: 8rem;    /* 128px */
```

## Layout

### Container Widths

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Z-Index

```css
--z-index-dropdown: 100;
--z-index-sticky: 200;
--z-index-fixed: 300;
--z-index-modal-backdrop: 400;
--z-index-modal: 500;
--z-index-popover: 600;
--z-index-tooltip: 700;
```

## UI Elements

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Buttons

#### Primary Button

```css
.btn-primary {
  background-color: var(--action-primary);
  color: var(--text-inverse);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  border: none;
  box-shadow: var(--shadow-light);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #d01530; /* Slightly darker */
  box-shadow: var(--shadow-medium);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

#### Secondary Button

```css
.btn-secondary {
  background-color: var(--action-secondary);
  color: var(--text-inverse);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  border: none;
  box-shadow: var(--shadow-light);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #003e5a; /* Slightly darker */
  box-shadow: var(--shadow-medium);
}
```

#### Tertiary Button

```css
.btn-tertiary {
  background-color: transparent;
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  transition: all 0.2s ease;
}

.btn-tertiary:hover {
  background-color: var(--background-tertiary);
}
```

### Form Elements

#### Input

```css
.input {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background-color: var(--surface-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  transition: all 0.2s ease;
}

.input:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.3);
}
```

#### Select

```css
.select {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background-color: var(--surface-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* Chevron down icon */
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  padding-right: var(--space-6);
}

.select:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.3);
}
```

#### Checkbox

```css
.checkbox {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background-color: var(--surface-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.checkbox:checked {
  background-color: var(--action-primary);
  border-color: var(--action-primary);
}

.checkbox:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
```

### Cards & Panels

```css
.card {
  background-color: var(--surface-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-light);
}

.panel {
  background-color: var(--surface-secondary);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-medium);
}
```

### Tags

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  background-color: var(--background-tertiary);
  border: 1px solid var(--border-light);
}

.tag-primary {
  color: var(--text-inverse);
  background-color: var(--action-primary);
  border: none;
}

.tag-secondary {
  color: var(--text-inverse);
  background-color: var(--action-secondary);
  border: none;
}
```

## Data Visualization

### Chart Colors

```css
--chart-color-1: var(--cfa-red);
--chart-color-2: var(--cfa-blue);
--chart-color-3: #5AC8FA;  /* Blue (Apple-like) */
--chart-color-4: #FF9500;  /* Orange (Apple-like) */
--chart-color-5: #34C759;  /* Green (Apple-like) */
--chart-color-6: #AF52DE;  /* Purple (Apple-like) */
--chart-color-7: #FF2D55;  /* Pink (Apple-like) */
--chart-color-8: #FFCC00;  /* Yellow (Apple-like) */
```

### Chart Styles

```css
.chart-container {
  background-color: var(--surface-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-light);
  padding: var(--space-4);
  border: 1px solid var(--border-light);
}

.chart-axis text {
  font-size: var(--font-size-xs);
  fill: var(--text-secondary);
}

.chart-axis line, .chart-axis path {
  stroke: var(--border-light);
}

.chart-grid line {
  stroke: var(--border-light);
  stroke-opacity: 0.5;
  stroke-dasharray: 2,2;
}

.chart-tooltip {
  background-color: var(--surface-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-medium);
  padding: var(--space-2);
  font-size: var(--font-size-sm);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-light);
}
```

## Animation & Transitions

```css
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 350ms ease;

.fade-in {
  animation: fadeIn var(--transition-normal);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slide-in-right {
  animation: slideInRight var(--transition-normal);
}

@keyframes slideInRight {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

## Accessibility

```css
--focus-ring: 0 0 0 2px var(--border-focus);

*:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## Icons

Use a consistent set of icons that match the Apple OSX aesthetic. Prefer outlined icons with consistent stroke width. Icons should be simple, clear, and recognizable.

### Icon Sizes

```css
--icon-size-sm: 16px;
--icon-size-md: 20px;
--icon-size-lg: 24px;
--icon-size-xl: 32px;
```
