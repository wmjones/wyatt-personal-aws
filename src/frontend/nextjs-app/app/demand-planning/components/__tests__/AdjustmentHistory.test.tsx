import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdjustmentHistory, { AdjustmentEntry } from '../AdjustmentHistory';

// Mock the confirmation dialog
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(),
});

describe('AdjustmentHistory', () => {
  const mockEntries: AdjustmentEntry[] = [
    {
      id: '1',
      adjustmentValue: 5.5,
      filterContext: {
        states: ['TX'],
        dmaIds: ['123'],
        dcIds: ['456'],
        inventoryItemId: null,
        dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' }
      },
      timestamp: '2024-01-01T00:00:00Z',
      inventoryItemName: 'Test Item',
      userEmail: 'test@example.com',
      userName: 'Test User',
      userId: 'user-123',
      isOwn: true,
      isActive: true
    },
    {
      id: '2',
      adjustmentValue: -3.2,
      filterContext: {
        states: ['CA'],
        dmaIds: ['789'],
        dcIds: ['012'],
        inventoryItemId: null,
        dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' }
      },
      timestamp: '2024-01-01T01:00:00Z',
      inventoryItemName: 'Another Item',
      userEmail: 'other@example.com',
      userName: 'Other User',
      userId: 'user-456',
      isOwn: false,
      isActive: true
    },
    {
      id: '3',
      adjustmentValue: 2.1,
      filterContext: {
        states: ['NY'],
        dmaIds: [],
        dcIds: [],
        inventoryItemId: null,
        dateRange: { startDate: '2024-01-15', endDate: '2024-01-31' }
      },
      timestamp: '2024-01-01T02:00:00Z',
      userEmail: 'test@example.com',
      userName: 'Test User',
      userId: 'user-123',
      isOwn: true,
      isActive: false
    }
  ];

  const mockHandlers = {
    onToggleActive: jest.fn() as jest.MockedFunction<(id: string, isActive: boolean) => Promise<void>>,
    onDelete: jest.fn() as jest.MockedFunction<(id: string) => Promise<void>>,
    onToggleShowAllUsers: jest.fn() as jest.MockedFunction<(showAll: boolean) => void>
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should display loading state', () => {
      render(
        <AdjustmentHistory
          entries={[]}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading adjustment history...')).toBeInTheDocument();
    });

    it('should display empty state when no entries', () => {
      render(
        <AdjustmentHistory
          entries={[]}
          isLoading={false}
        />
      );

      expect(screen.getByText('No adjustments have been made yet.')).toBeInTheDocument();
    });

    it('should display adjustment entries with user information', () => {
      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
        />
      );

      // Check that adjustments are displayed
      expect(screen.getByText('+5.5%')).toBeInTheDocument();
      expect(screen.getByText('-3.2%')).toBeInTheDocument();
      expect(screen.getByText('+2.1%')).toBeInTheDocument();

      // Check user attribution (updated format without email in main display)
      expect(screen.getAllByText('By: Test User')).toHaveLength(2);
      expect(screen.getByText('By: Other User')).toBeInTheDocument();

      // Check item names
      expect(screen.getByText(/Test Item/)).toBeInTheDocument();
      expect(screen.getByText(/Another Item/)).toBeInTheDocument();
    });

    it('should show inactive status for deactivated adjustments', () => {
      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
        />
      );

      // The third entry is inactive
      const inactiveElements = screen.getAllByText('(Inactive)');
      expect(inactiveElements).toHaveLength(1);
    });

    it('should display period information when available', () => {
      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
        />
      );

      expect(screen.getAllByText('Period: 2024-01-01 to 2024-01-31')).toHaveLength(2); // Two entries have same period
      expect(screen.getByText('Period: 2024-01-15 to 2024-01-31')).toBeInTheDocument();
    });
  });

  describe('Show All Users Toggle', () => {
    it('should display toggle when handler is provided', () => {
      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          showAllUsers={true}
          onToggleShowAllUsers={mockHandlers.onToggleShowAllUsers}
        />
      );

      expect(screen.getByText('Show all users')).toBeInTheDocument();
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveClass('bg-dp-cfa-red'); // Active state
    });

    it('should call toggle handler when clicked', async () => {
      const user = userEvent.setup();

      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          showAllUsers={true}
          onToggleShowAllUsers={mockHandlers.onToggleShowAllUsers}
        />
      );

      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);

      expect(mockHandlers.onToggleShowAllUsers).toHaveBeenCalledWith(false);
    });

    it('should show inactive state when showAllUsers is false', () => {
      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          showAllUsers={false}
          onToggleShowAllUsers={mockHandlers.onToggleShowAllUsers}
        />
      );

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveClass('bg-dp-background-tertiary'); // Inactive state
    });
  });

  describe('User Actions', () => {
    it('should show action buttons only for own adjustments', () => {
      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          onToggleActive={mockHandlers.onToggleActive}
          onDelete={mockHandlers.onDelete}
        />
      );

      // Should have action buttons for user's own adjustments (2 adjustments belong to current user)
      const deactivateButtons = screen.getAllByText('Deactivate');
      const activateButtons = screen.getAllByText('Activate');
      const deleteButtons = screen.getAllByText('Delete');

      expect(deactivateButtons).toHaveLength(1); // One active adjustment from current user
      expect(activateButtons).toHaveLength(1); // One inactive adjustment from current user
      expect(deleteButtons).toHaveLength(2); // Two adjustments from current user

      // Note: Non-owned adjustments should not show action buttons
      // This is verified by checking the number of action buttons above
    });

    it('should call toggle active handler when deactivate button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          onToggleActive={mockHandlers.onToggleActive}
          onDelete={mockHandlers.onDelete}
        />
      );

      const deactivateButton = screen.getByText('Deactivate');
      await user.click(deactivateButton);

      expect(mockHandlers.onToggleActive).toHaveBeenCalledWith('1', false);
    });

    it('should call toggle active handler when activate button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          onToggleActive={mockHandlers.onToggleActive}
          onDelete={mockHandlers.onDelete}
        />
      );

      const activateButton = screen.getByText('Activate');
      await user.click(activateButton);

      expect(mockHandlers.onToggleActive).toHaveBeenCalledWith('3', true);
    });

    it('should call delete handler when delete button is clicked and confirmed', async () => {
      const user = userEvent.setup();

      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          onToggleActive={mockHandlers.onToggleActive}
          onDelete={mockHandlers.onDelete}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this adjustment?');
      expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
    });

    it('should not call delete handler when deletion is cancelled', async () => {
      const user = userEvent.setup();
      (window.confirm as jest.Mock).mockReturnValue(false);

      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          onToggleActive={mockHandlers.onToggleActive}
          onDelete={mockHandlers.onDelete}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    });

    it('should show loading state on buttons during actions', async () => {
      const user = userEvent.setup();
      // Mock a slow response to test loading state
      mockHandlers.onToggleActive.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          onToggleActive={mockHandlers.onToggleActive}
          onDelete={mockHandlers.onDelete}
        />
      );

      const deactivateButton = screen.getByText('Deactivate');
      await user.click(deactivateButton);

      // Should show loading text
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for action to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <AdjustmentHistory
          entries={mockEntries}
          isLoading={false}
          showAllUsers={true}
          onToggleShowAllUsers={mockHandlers.onToggleShowAllUsers}
          onToggleActive={mockHandlers.onToggleActive}
          onDelete={mockHandlers.onDelete}
        />
      );

      // Check that buttons are accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Check heading
      expect(screen.getByRole('heading', { name: 'Recent Adjustments' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle entries without user information', () => {
      const entriesWithoutUserInfo = [
        {
          id: '1',
          adjustmentValue: 5.5,
          filterContext: {
            states: ['TX'],
            dmaIds: [],
            dcIds: [],
            inventoryItemId: null,
            dateRange: { startDate: null, endDate: null }
          },
          timestamp: '2024-01-01T00:00:00Z',
          isOwn: true,
          isActive: true
        }
      ];

      render(
        <AdjustmentHistory
          entries={entriesWithoutUserInfo}
          isLoading={false}
        />
      );

      expect(screen.getByText('+5.5%')).toBeInTheDocument();
      // Should not crash when user info is missing
    });

    it('should handle entries without date range', () => {
      const entriesWithoutDateRange = [
        {
          id: '1',
          adjustmentValue: 5.5,
          filterContext: {
            states: ['TX'],
            dmaIds: [],
            dcIds: [],
            inventoryItemId: null,
            dateRange: { startDate: null, endDate: null }
          },
          timestamp: '2024-01-01T00:00:00Z',
          isOwn: true,
          isActive: true
        }
      ];

      render(
        <AdjustmentHistory
          entries={entriesWithoutDateRange}
          isLoading={false}
        />
      );

      expect(screen.getByText('+5.5%')).toBeInTheDocument();
      // Should not show period info when date range is null
      expect(screen.queryByText(/Period:/)).not.toBeInTheDocument();
    });
  });
});
