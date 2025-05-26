# UI Component Library

A comprehensive set of reusable UI components built with React, TypeScript, and Tailwind CSS for the demand planning dashboard.

## Architecture

The component library follows a hierarchical structure:

```
ui/
├── primitives/     # Basic building blocks (Button, Card, etc.)
├── forms/         # Form-related components (Input, Select, etc.)
├── feedback/      # User feedback components (Loading, Error, Empty states)
├── layout/        # Layout components (Container, Grid, etc.)
├── theme.ts       # Design system tokens
├── types.ts       # Shared TypeScript interfaces
└── utils.ts       # Utility functions
```

## Design Principles

1. **Consistency**: All components follow the same design patterns and API conventions
2. **Accessibility**: Built with WCAG 2.1 AA compliance in mind
3. **Type Safety**: Fully typed with TypeScript for better developer experience
4. **Performance**: Optimized for minimal re-renders and bundle size
5. **Customizability**: Flexible styling through className prop and variants

## Usage

### Basic Example

```tsx
import { Button, Card, LoadingState } from '@/components/ui';

function MyComponent() {
  return (
    <Card variant="elevated" padding="lg">
      <h2>Welcome</h2>
      <Button variant="primary" size="md">
        Get Started
      </Button>
    </Card>
  );
}
```

### Theme Customization

The theme is defined in `theme.ts` and provides consistent design tokens:

```tsx
import { theme } from '@/components/ui/theme';

// Use theme values in your components
const customStyles = {
  color: theme.colors.dp.primary,
  padding: theme.spacing.md,
};
```

## Component Documentation

### Primitives

#### Button
A versatile button component with multiple variants and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'tertiary' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `fullWidth`: boolean
- `leftIcon`/`rightIcon`: ReactNode

**Example:**
```tsx
<Button variant="primary" size="lg" loading>
  Save Changes
</Button>
```

#### Card
A container component for grouping related content.

**Props:**
- `variant`: 'default' | 'elevated'
- `padding`: 'sm' | 'md' | 'lg'

**Example:**
```tsx
<Card variant="elevated" padding="lg">
  <p>Card content</p>
</Card>
```

### Feedback Components

#### LoadingState
Consistent loading indicator with customizable size and message.

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `message`: string

**Example:**
```tsx
<LoadingState size="lg" message="Loading data..." />
```

#### ErrorState
Error display with optional retry action.

**Props:**
- `title`: string
- `message`: string (required)
- `action`: { label: string, onClick: () => void }

**Example:**
```tsx
<ErrorState
  message="Failed to load data"
  action={{ label: "Retry", onClick: handleRetry }}
/>
```

#### EmptyState
Empty data state with customizable icon and action.

**Props:**
- `title`: string
- `message`: string (required)
- `icon`: ReactNode
- `action`: { label: string, onClick: () => void }

**Example:**
```tsx
<EmptyState
  title="No results"
  message="Try adjusting your filters"
  action={{ label: "Clear filters", onClick: clearFilters }}
/>
```

## Utility Functions

### cn()
Combines class names with Tailwind CSS conflict resolution.

```tsx
import { cn } from '@/components/ui/utils';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  'override-class'
);
```

### formatNumber()
Locale-aware number formatting.

```tsx
import { formatNumber } from '@/components/ui/utils';

formatNumber(1234.56); // "1,234.56"
formatNumber(1234.56, { style: 'currency', currency: 'USD' }); // "$1,234.56"
```

### formatDate()
Locale-aware date formatting.

```tsx
import { formatDate } from '@/components/ui/utils';

formatDate(new Date()); // "1/1/2024"
formatDate(new Date(), { dateStyle: 'long' }); // "January 1, 2024"
```

## Testing

All components include data-testid attributes for easy testing:

```tsx
// In your tests
const button = screen.getByTestId('button');
const loadingState = screen.getByTestId('loading-state');
```

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Contributing

When adding new components:
1. Follow the established patterns and conventions
2. Include comprehensive TypeScript types
3. Add proper documentation with examples
4. Ensure accessibility compliance
5. Write unit tests
6. Update this README

## Future Components

Planned additions to the library:
- [ ] BaseDropdown (foundation for all dropdowns)
- [ ] Input (text input with validation)
- [ ] Select (single/multi-select dropdown)
- [ ] Modal (accessible modal dialog)
- [ ] Tooltip (hover/focus tooltips)
- [ ] Table (data table with sorting/filtering)
- [ ] Tabs (tabbed navigation)
- [ ] Toast (notification system)
