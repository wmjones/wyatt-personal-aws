import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { AdjustmentEntry } from '../components/AdjustmentHistory';
import toast from 'react-hot-toast';
import { errorLogger, formatErrorForUser } from '@/app/lib/error-logger';

export default function useAdjustmentHistory() {
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(true); // Default to showing all users
  const auth = useAuth();

  // Fetch adjustment history
  const fetchAdjustmentHistory = useCallback(async () => {
    if (!auth.isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await auth.getIdToken();

      const response = await fetch(`/api/adjustments?all=${showAllUsers}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        errorLogger.logNetworkError('/api/adjustments', response.status, await response.text());
        throw new Error(`Failed to fetch adjustment history: ${response.status}`);
      }

      const result = await response.json();
      setAdjustmentHistory(result.adjustments || []);
    } catch (error) {
      errorLogger.logLoadError(error, {
        userId: auth.user?.sub,
        request: { showAllUsers }
      });
      const errorMessage = formatErrorForUser(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [auth, showAllUsers]);

  // Save adjustment and refresh history
  const saveAdjustment = useCallback(async (
    adjustmentValue: number,
    filterContext: unknown,
    inventoryItemName?: string
  ) => {
    if (!auth.isAuthenticated) {
      throw new Error('You must be logged in to save adjustments');
    }

    const token = await auth.getIdToken();

    const requestBody = {
      adjustmentValue,
      filterContext,
      inventoryItemName
    };

    const response = await fetch('/api/adjustments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      errorLogger.logSaveError(errorData, {
        userId: auth.user?.sub,
        request: requestBody,
        response: errorData
      });
      throw new Error(errorData.error || `Failed to save adjustment: ${response.status}`);
    }

    const result = await response.json();

    // Optimistically update the local state
    setAdjustmentHistory(prev => [result.adjustment, ...prev]);

    // Refresh from server to ensure consistency
    // This happens in background to avoid UI delay
    fetchAdjustmentHistory();

    return result.adjustment;
  }, [auth, fetchAdjustmentHistory]);

  // Toggle adjustment active state
  const toggleAdjustmentActive = useCallback(async (id: string, isActive: boolean) => {
    if (!auth.isAuthenticated) {
      throw new Error('You must be logged in to update adjustments');
    }

    try {
      const token = await auth.getIdToken();
      const response = await fetch('/api/adjustments', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, isActive })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update adjustment');
      }

      // Refresh the list
      await fetchAdjustmentHistory();
      toast.success(isActive ? 'Adjustment activated' : 'Adjustment deactivated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update adjustment';
      toast.error(errorMessage);
      throw err;
    }
  }, [auth, fetchAdjustmentHistory]);

  // Delete adjustment
  const deleteAdjustment = useCallback(async (id: string) => {
    if (!auth.isAuthenticated) {
      throw new Error('You must be logged in to delete adjustments');
    }

    try {
      const token = await auth.getIdToken();
      const response = await fetch(`/api/adjustments?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete adjustment');
      }

      // Refresh the list
      await fetchAdjustmentHistory();
      toast.success('Adjustment deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete adjustment';
      toast.error(errorMessage);
      throw err;
    }
  }, [auth, fetchAdjustmentHistory]);

  // Load on mount if authenticated
  useEffect(() => {
    if (auth.isAuthenticated && !auth.loading) {
      fetchAdjustmentHistory();
    }
  }, [auth.isAuthenticated, auth.loading, fetchAdjustmentHistory]);

  return {
    adjustmentHistory,
    isLoading,
    error,
    showAllUsers,
    setShowAllUsers,
    saveAdjustment,
    refreshHistory: fetchAdjustmentHistory,
    toggleAdjustmentActive,
    deleteAdjustment
  };
}
