# Filter System Documentation

## Overview
The demand planning dashboard uses a modern multi-select filter system that allows users to filter forecast data by States, DMA (Designated Market Areas), and Distribution Centers (DC IDs).

## Components

### MultiSelectFilter
A reusable multi-select dropdown component with the following features:
- **Search functionality**: Filter options by typing
- **Select/Deselect All**: Bulk selection operations
- **Tag display**: Shows selected items as removable tags
- **Keyboard navigation**: Accessible keyboard interactions
- **Responsive design**: Mobile-friendly interface

### FilterSidebar
The main filter interface that replaces the previous HierarchySidebar:
- **States Filter**: 5 US states (CA, TX, FL, NY, IL)
- **DMA Filter**: 30 unique 3-letter codes with deterministic generation
- **DC Filter**: 60 distribution centers (IDs 1-60)
- **Active filter summary**: Shows count of selected filters
- **Clear all functionality**: Reset all selections

## Data Structure

### Filter Selections
```typescript
interface FilterSelections {
  states: string[];      // US state abbreviations
  dmaIds: string[];     // 3-letter DMA codes
  dcIds: string[];      // DC integer IDs as strings
}
```

### Filter Options
```typescript
interface FilterOption {
  value: string;  // The filter value
  label: string;  // Display label for the option
}
```

## Integration

The filter system integrates with the demand planning page through:
1. **FilterSidebar** component in the left sidebar
2. **FilterSelections** state management in the main page
3. **Callback system** for propagating filter changes
4. **Backward compatibility** with existing forecast hooks

## Benefits

- **Better UX**: Modern multi-select interface with search
- **Performance**: Efficient filtering with minimal re-renders
- **Accessibility**: WCAG compliant with keyboard navigation
- **Scalability**: Easily extensible for additional filter types
- **Type Safety**: Full TypeScript support with proper interfaces

## Migration from Hierarchy System

The new filter system replaces the previous hierarchy-based selection:
- **Before**: Complex tree navigation with single-type selection
- **After**: Simple multi-select dropdowns with cross-cutting filters
- **Data alignment**: Matches the actual data structure (states, DMAs, DC IDs)
- **Improved performance**: Faster selection and clearer user intent
