# Demand Planning Dashboard

## Project Overview

The Demand Planning Dashboard is a web-based application built with Next.js and D3.js that enables users to view forecasts at multiple granularities and make adjustments across different hierarchical dimensions. This dashboard follows an Apple OSX aesthetic with Chick-fil-A coloring.

## Design and Implementation Documentation

This folder contains the following design and implementation documents:

1. **[Component Architecture](./component-architecture.md)** - Outlines the component hierarchy, data flow, and key components.
2. **[Wireframes](./wireframes.md)** - Provides visual representations and descriptions of key screens.
3. **[Data Structures](./data-structures.md)** - Defines TypeScript interfaces for the data structures used in the dashboard.
4. **[User Flows](./user-flows.md)** - Outlines key user interaction flows and expected behaviors.
5. **[Style Guide](./style-guide.md)** - Defines the visual design system with CSS variables and component styles.
6. **[Implementation Plan](./implementation-plan.md)** - Provides a phased approach to implementation with detailed tasks.

## Core Requirements

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

## Technical Stack

- Next.js 14 with App Router
- D3.js for data visualization
- Tailwind CSS for styling
- React Context API for state management
- TypeScript for type safety

## Design Philosophy

The design follows an Apple OSX aesthetic with Chick-fil-A coloring, focusing on:

- Clean, minimal interface with plenty of whitespace
- Subtle use of layering and translucency
- Clear visual hierarchy and organization
- Responsive layout that works well on all devices
- Accessible interface with proper keyboard support and screen reader compatibility

## Implementation Approach

The implementation is structured in phases:

1. Foundation Setup - Project structure, configuration, and basic layout components
2. Hierarchical Selection - Hierarchy components and data management
3. Data Visualization - Chart components and data integration
4. Adjustment Interface - Adjustment components and logic
5. History and Audit - History components and data management
6. User Experience Enhancements - Animations, transitions, and responsive refinements
7. Accessibility and Polish - Final accessibility improvements and visual polish

## Getting Started

To start development on this project:

1. Clone the repository
2. Navigate to the project directory: `cd src/frontend/nextjs-app`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`
5. Open your browser at [http://localhost:3000/demand-planning](http://localhost:3000/demand-planning)

## Contributing

When contributing to this project:

1. Follow the component structure defined in the component architecture
2. Adhere to the style guide for consistent design
3. Ensure all components are responsive and accessible
4. Write tests for new components and features
5. Document any API requirements or changes
