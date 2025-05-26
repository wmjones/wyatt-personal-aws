# Dropdown TanStack Query Migration Guide

This guide helps developers migrate dropdown components from direct service calls to TanStack Query hooks.

## Before (Direct Service Calls)

```tsx
import { forecastService } from '@/app/services/forecastService';

function MyComponent() {
  const [stateOptions, setStateOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStates = async () => {
      try {
        setIsLoading(true);
        const states = await forecastService.getDistinctStates();
        setStateOptions(states.map(s => ({ id: s, label: s })));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadStates();
  }, []);

  // ... render logic
}
```

## After (TanStack Query Hooks)

```tsx
import { useStateOptions } from '@/app/hooks/useDropdownOptions';

function MyComponent() {
  const { data: stateOptions = [], isLoading, error } = useStateOptions();

  // ... render logic (data is already transformed to dropdown format)
}
```

## Benefits of Migration

1. **Automatic Request Deduplication**: Multiple components requesting the same data will only trigger one network request
2. **Built-in Caching**: Data is cached for 10 minutes, reducing unnecessary API calls
3. **Background Refetching**: Stale data is served immediately while fresh data loads in the background
4. **Consistent Error Handling**: Error states are managed consistently across all dropdowns
5. **Loading State Management**: Loading states are handled automatically
6. **TypeScript Support**: Full type safety with proper return types

## Migration Steps

### 1. Replace Service Imports

```diff
- import { forecastService } from '@/app/services/forecastService';
+ import { useStateOptions, useDMAOptions, useDCOptions, useInventoryItemOptions } from '@/app/hooks/useDropdownOptions';
```

### 2. Remove Manual State Management

```diff
- const [stateOptions, setStateOptions] = useState([]);
- const [isLoading, setIsLoading] = useState(true);
- const [error, setError] = useState(null);
+ const { data: stateOptions = [], isLoading, error } = useStateOptions();
```

### 3. Remove useEffect Calls

```diff
- useEffect(() => {
-   const loadStates = async () => {
-     try {
-       setIsLoading(true);
-       const states = await forecastService.getDistinctStates();
-       setStateOptions(states.map(s => ({ id: s, label: s })));
-     } catch (err) {
-       setError(err.message);
-     } finally {
-       setIsLoading(false);
-     }
-   };
-
-   loadStates();
- }, []);
```

### 4. Update Data Format

The hooks return data in the correct format for dropdowns:

```typescript
interface DropdownOption {
  value: string;  // Note: 'value' not 'id'
  label: string;
}
```

If your component expects `id` instead of `value`, update it:

```diff
- options={stateOptions}  // expecting { id, label }
+ options={stateOptions.map(opt => ({ id: opt.value, label: opt.label }))}
```

Or better, update your dropdown component to use `value`:

```diff
- <option value={option.id}>{option.label}</option>
+ <option value={option.value}>{option.label}</option>
```

## Dependent Queries

For dropdowns that depend on other selections:

```tsx
function MyComponent({ selectedState }) {
  // Only fetch DMAs when a state is selected
  const { data: dmaOptions = [] } = useDMAOptions(
    { stateId: selectedState },
    { enabled: !!selectedState }
  );
}
```

## Error Handling

```tsx
const { data, isLoading, error } = useStateOptions();

if (error) {
  return <ErrorMessage message={error.message} />;
}
```

## Prefetching

To improve perceived performance, prefetch data on hover:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { dropdownKeys } from '@/app/services/dropdown/queryKeys';
import { fetchStateOptions } from '@/app/services/dropdown/queryFunctions';

function MyComponent() {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: dropdownKeys.states(),
      queryFn: fetchStateOptions,
    });
  };

  return (
    <button onMouseEnter={handleMouseEnter}>
      Open Dropdown
    </button>
  );
}
```

## Testing

Update your tests to mock the hooks instead of the service:

```tsx
jest.mock('@/app/hooks/useDropdownOptions', () => ({
  useStateOptions: () => ({
    data: [
      { value: 'CA', label: 'CA' },
      { value: 'TX', label: 'TX' },
    ],
    isLoading: false,
    error: null,
  }),
}));
```
