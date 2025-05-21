# Demand Planning Dashboard Requirements

## Overview
A web-based dashboard for demand planning that enables users to view forecasts at multiple granularities and make adjustments across different hierarchical dimensions. D3 for plots and a nextjs app for the page.

## Core Functionality

### Hierarchical Selection
- Support for multiple hierarchy types (Geography, Product, Customer, Campaign)
- Multi-level nesting (e.g., Region > Country > DMA)
- Multi-select capability across different hierarchy levels
- Search and filter functionality for hierarchies
- Visual indicators for selection state

### Forecast Adjustments
- Apply percentage or absolute value adjustments
- Target specific hierarchical elements (individual DMAs, regions, products, etc.)
- Support for specifying time periods for adjustments (all periods, specific quarters)
- Adjustment reason categorization and tracking
- Notes/comments for adjustment documentation

### Data Visualization
- Line charts for forecast trends over time
- Line charts for baseline vs. adjusted forecast comparison
- Charts use user adjustments applied to a baseline forecast
- Responsive layouts for all screen sizes
- Interactive elements (tooltips, hover states)

### Adjustment History
- Tabular display of all forecast adjustments
- Filtering and sorting capabilities across hierarchies
- Details on who made adjustments, when, and why

## UI Requirements

### Style
- Apple OSX aesthetic with Chick-fil-a coloring
- Use plenty of whitespace and a clear visual hierarchy
- Subtle use of layering and translucency to create a sense of context
- Emphasizes clarity, efficiency, and elegance

### Layout
- Persistent header with time period controls and refresh option
- Sidebar for hierarchy selection (collapsible on mobile)
- Main content area with tabs for different views
- Modal interface for adjustment inputs

### Components
- Expandable tree view for hierarchies
- Tag-style indicators for current selections
- Data visualization charts
- Time period selector
- Tabular data display
- Form elements for adjustment parameters

### Interactions
- Checkbox selection for multiple hierarchy items
- Expand/collapse hierarchy nodes
- Apply adjustments to selected hierarchies
- View historical adjustments
- Switch between different time granularities (weekly, monthly, quarterly)

## Technical Requirements

### Data
- Support for hierarchical data structures
- Time series data for forecasts
- User/role information for tracking adjustments

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Focus indicators for interactive elements

## User Experience Goals

- Enable demand planners to quickly assess forecasts at different granularity levels
- Simplify the process of making forecast adjustments across different dimensions
- Provide clear visibility into past adjustments and their impacts
- Support collaborative forecasting with transparent tracking of changes
- Minimize clicks and interactions needed to complete common tasks
