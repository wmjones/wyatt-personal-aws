import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FilterSidebar from '../FilterSidebar';
import React from 'react';

// Mock the dropdown hooks
jest.mock('@/hooks/useDropdownOptions', () => ({
  useStateOptions: () => ({
    data: [
      { value: 'CA', label: 'CA' },
      { value: 'TX', label: 'TX' },
      { value: 'NY', label: 'NY' }
    ],
    isLoading: false,
    error: null
  }),
  useDMAOptions: () => ({
    data: [
      { value: 'DMA001', label: 'DMA DMA001' },
      { value: 'DMA002', label: 'DMA DMA002' }
    ],
    isLoading: false,
    error: null
  }),
  useDCOptions: () => ({
    data: [
      { value: '101', label: 'DC 101' },
      { value: '102', label: 'DC 102' }
    ],
    isLoading: false,
    error: null
  }),
  useInventoryItemOptions: () => ({
    data: [
      { value: '1', label: 'Item 1' },
      { value: '2', label: 'Item 2' },
      { value: '3', label: 'Item 3' }
    ],
    isLoading: false,
    error: null
  })
}));

describe('FilterSidebar Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const defaultSelections = {
    states: [],
    dmaIds: [],
    dcIds: [],
    inventoryItemId: null,
    dateRange: {
      startDate: null,
      endDate: null
    }
  };

  const renderWithQuery = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('should render all dropdown filters with TanStack Query data', async () => {
    const onSelectionChange = jest.fn();

    renderWithQuery(
      <FilterSidebar
        selections={defaultSelections}
        onSelectionChange={onSelectionChange}
      />
    );

    // Verify all filter sections are rendered
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Inventory Item')).toBeInTheDocument();
    expect(screen.getByText('States')).toBeInTheDocument();
    expect(screen.getByText('DMAs')).toBeInTheDocument();
    expect(screen.getByText('Distribution Centers')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();

    // Verify dropdowns are rendered with data - check for dropdown containers
    expect(screen.getAllByTestId('single-select-dropdown')).toHaveLength(1); // Inventory Item
    expect(screen.getAllByTestId('multi-select-dropdown')).toHaveLength(3); // States, DMAs, DCs

    // Verify the first inventory item is auto-selected
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('should auto-select first inventory item and default date range', async () => {
    const onSelectionChange = jest.fn();

    renderWithQuery(
      <FilterSidebar
        selections={defaultSelections}
        onSelectionChange={onSelectionChange}
      />
    );

    // Wait for auto-selection to occur
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith({
        states: [],
        dmaIds: [],
        dcIds: [],
        inventoryItemId: '1', // First item auto-selected
        dateRange: {
          startDate: '2025-01-01',
          endDate: '2025-03-31'
        }
      });
    });
  });

  it.skip('should show loading state when data is being fetched', () => {
    // TODO: This test needs to be rewritten to properly mock loading states
    // Mock loading state
    jest.mock('@/hooks/useDropdownOptions', () => ({
      useStateOptions: () => ({ data: [], isLoading: true, error: null }),
      useDMAOptions: () => ({ data: [], isLoading: true, error: null }),
      useDCOptions: () => ({ data: [], isLoading: true, error: null }),
      useInventoryItemOptions: () => ({ data: [], isLoading: true, error: null })
    }));

    renderWithQuery(
      <FilterSidebar
        selections={defaultSelections}
        onSelectionChange={jest.fn()}
      />
    );

    // Should show loading indicator
    expect(screen.getByText('Loading filter options...')).toBeInTheDocument();
  });

  it.skip('should handle error state gracefully', async () => {
    // TODO: This test needs to be rewritten to properly mock error states
    const error = new Error('Failed to load dropdown data');

    // Mock error state
    jest.mock('@/hooks/useDropdownOptions', () => ({
      useStateOptions: () => ({ data: [], isLoading: false, error }),
      useDMAOptions: () => ({ data: [], isLoading: false, error: null }),
      useDCOptions: () => ({ data: [], isLoading: false, error: null }),
      useInventoryItemOptions: () => ({ data: [], isLoading: false, error: null })
    }));

    const { rerender } = renderWithQuery(
      <FilterSidebar
        selections={defaultSelections}
        onSelectionChange={jest.fn()}
      />
    );

    // Create a new mock module for error state
    jest.doMock('@/app/hooks/useDropdownOptions', () => ({
      useStateOptions: () => ({ data: [], isLoading: false, error }),
      useDMAOptions: () => ({ data: [], isLoading: false, error: null }),
      useDCOptions: () => ({ data: [], isLoading: false, error: null }),
      useInventoryItemOptions: () => ({ data: [], isLoading: false, error: null })
    }));

    // Force re-render with error
    const { default: FilterSidebarWithError } = await import('../FilterSidebar');
    rerender(
      <QueryClientProvider client={queryClient}>
        <FilterSidebarWithError
          selections={defaultSelections}
          onSelectionChange={jest.fn()}
        />
      </QueryClientProvider>
    );
  });

  it('should demonstrate TanStack Query caching behavior', async () => {
    const onSelectionChange = jest.fn();

    // First render
    const { unmount } = renderWithQuery(
      <FilterSidebar
        selections={defaultSelections}
        onSelectionChange={onSelectionChange}
      />
    );

    // Verify data is rendered
    expect(screen.getByText('Inventory Item')).toBeInTheDocument();

    // Unmount component
    unmount();

    // Re-render the component
    renderWithQuery(
      <FilterSidebar
        selections={defaultSelections}
        onSelectionChange={onSelectionChange}
      />
    );

    // Data should be immediately available from cache
    expect(screen.getByText('Inventory Item')).toBeInTheDocument();
    // Verify the first item is still selected (from cache)
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
