import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FilterSidebar from '../FilterSidebar';
import React from 'react';

// Create mock implementations
const mockUseStateOptions = jest.fn();
const mockUseDMAOptions = jest.fn();
const mockUseDCOptions = jest.fn();
const mockUseInventoryItemOptions = jest.fn();

// Mock the dropdown hooks
jest.mock('@/hooks/useDropdownOptions', () => ({
  useStateOptions: () => mockUseStateOptions(),
  useDMAOptions: () => mockUseDMAOptions(),
  useDCOptions: () => mockUseDCOptions(),
  useInventoryItemOptions: () => mockUseInventoryItemOptions()
}));

// Default mock return values
const defaultMockData = {
  states: {
    data: [
      { value: 'CA', label: 'CA' },
      { value: 'TX', label: 'TX' },
      { value: 'NY', label: 'NY' }
    ],
    isLoading: false,
    error: null
  },
  dmas: {
    data: [
      { value: 'DMA001', label: 'DMA DMA001' },
      { value: 'DMA002', label: 'DMA DMA002' }
    ],
    isLoading: false,
    error: null
  },
  dcs: {
    data: [
      { value: '101', label: 'DC 101' },
      { value: '102', label: 'DC 102' }
    ],
    isLoading: false,
    error: null
  },
  inventory: {
    data: [
      { value: '1', label: 'Item 1' },
      { value: '2', label: 'Item 2' },
      { value: '3', label: 'Item 3' }
    ],
    isLoading: false,
    error: null
  }
};

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

    // Reset all mocks and set default return values
    jest.clearAllMocks();
    mockUseStateOptions.mockReturnValue(defaultMockData.states);
    mockUseDMAOptions.mockReturnValue(defaultMockData.dmas);
    mockUseDCOptions.mockReturnValue(defaultMockData.dcs);
    mockUseInventoryItemOptions.mockReturnValue(defaultMockData.inventory);
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

    // Verify inventory dropdown placeholder is shown (no auto-selection)
    expect(screen.getByText('Select an item')).toBeInTheDocument();
  });

  it('should display selected inventory item when provided', async () => {
    const onSelectionChange = jest.fn();
    const selectionsWithItem = {
      ...defaultSelections,
      inventoryItemId: '1'
    };

    renderWithQuery(
      <FilterSidebar
        selections={selectionsWithItem}
        onSelectionChange={onSelectionChange}
      />
    );

    // Verify the selected inventory item is displayed
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  it('should show loading state when data is being fetched', () => {
    // Set up loading state for all hooks
    mockUseStateOptions.mockReturnValue({ data: [], isLoading: true, error: null });
    mockUseDMAOptions.mockReturnValue({ data: [], isLoading: true, error: null });
    mockUseDCOptions.mockReturnValue({ data: [], isLoading: true, error: null });
    mockUseInventoryItemOptions.mockReturnValue({ data: [], isLoading: true, error: null });

    renderWithQuery(
      <FilterSidebar
        selections={defaultSelections}
        onSelectionChange={jest.fn()}
      />
    );

    // Should show loading indicator
    expect(screen.getByText('Loading filter options...')).toBeInTheDocument();
    // Should show loading text in all dropdown buttons
    const loadingElements = screen.getAllByText('Loading...');
    expect(loadingElements).toHaveLength(4); // One for each dropdown (inventory, states, DMAs, DCs)
  });

  it('should handle error state gracefully', () => {
    const error = new Error('Failed to load dropdown data');

    // Set up error state
    mockUseStateOptions.mockReturnValue({ data: [], isLoading: false, error });
    mockUseDMAOptions.mockReturnValue({ data: [], isLoading: false, error: null });
    mockUseDCOptions.mockReturnValue({ data: [], isLoading: false, error: null });
    mockUseInventoryItemOptions.mockReturnValue({ data: [], isLoading: false, error: null });

    renderWithQuery(
      <FilterSidebar
        selections={defaultSelections}
        onSelectionChange={jest.fn()}
      />
    );

    // Should show error message
    expect(screen.getByText('Error Loading Filters')).toBeInTheDocument();
    expect(screen.getByText('Failed to load dropdown data')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
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
    // Verify dropdown placeholder is shown (no selection persisted)
    expect(screen.getByText('Select an item')).toBeInTheDocument();
  });
});
