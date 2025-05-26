# Dropdown Data Fetching with TanStack Query

This directory contains the query infrastructure for fetching dropdown options using TanStack Query.

## Query Key Structure

We use a hierarchical query key structure to ensure proper cache management:

```typescript
// Base key for all dropdown queries
['dropdownOptions']

// State options (no filters)
['dropdownOptions', 'states']

// DMA options (can be filtered by state)
['dropdownOptions', 'dmas', { stateId?: string }]

// DC options (can be filtered by state or DMA)
['dropdownOptions', 'dcs', { stateId?: string, dmaId?: string }]

// Inventory items (no filters)
['dropdownOptions', 'inventoryItems']

// Restaurants (no filters)
['dropdownOptions', 'restaurants']
```

## Usage

### Basic Usage

```tsx
import { useStateOptions } from '@/app/hooks/useDropdownOptions';

function MyComponent() {
  const { data: states, isLoading, error } = useStateOptions();

  if (isLoading) return <div>Loading states...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <select>
      {states.map(state => (
        <option key={state.value} value={state.value}>
          {state.label}
        </option>
      ))}
    </select>
  );
}
```

### With Filters

```tsx
import { useDMAOptions } from '@/app/hooks/useDropdownOptions';

function MyComponent({ selectedState }) {
  const { data: dmas, isLoading } = useDMAOptions(
    { stateId: selectedState },
    {
      enabled: !!selectedState // Only fetch when state is selected
    }
  );

  // ... render logic
}
```

## Caching Strategy

All dropdown queries use the following caching configuration:

- **staleTime**: 10 minutes - Data is considered fresh for 10 minutes
- **gcTime**: 30 minutes - Data is kept in cache for 30 minutes after becoming inactive
- **refetchOnWindowFocus**: false - Don't refetch when window regains focus
- **retry**: 2 - Retry failed requests twice

## Performance Optimizations

1. **Request Deduplication**: TanStack Query automatically deduplicates concurrent requests for the same data
2. **Background Refetching**: Stale data is served immediately while fresh data is fetched in the background
3. **Dependent Queries**: Use the `enabled` option to prevent unnecessary requests when dependencies aren't met

## Adding New Dropdown Types

To add a new dropdown type:

1. Add the query key factory in `queryKeys.ts`:
```typescript
newDropdown: (filters?: { someFilter?: string }) =>
  [...dropdownKeys.all, 'newDropdown', filters || {}] as const,
```

2. Add the query function in `queryFunctions.ts`:
```typescript
export async function fetchNewDropdownOptions(filters?: { someFilter?: string }): Promise<DropdownOption[]> {
  const data = await someService.getNewDropdownData(filters);
  return transformToDropdownOptions(data);
}
```

3. Create the hook in `useDropdownOptions.ts`:
```typescript
export function useNewDropdownOptions(
  filters?: { someFilter?: string },
  options?: UseQueryOptions<DropdownOption[], Error>
) {
  return useQuery({
    queryKey: dropdownKeys.newDropdown(filters),
    queryFn: () => fetchNewDropdownOptions(filters),
    ...DROPDOWN_QUERY_OPTIONS,
    ...options,
  });
}
```
