'use client';

import { useState, useEffect } from 'react';
import { AdjustmentHistoryEntry } from '@/app/types/demand-planning';
import { getAdjustmentHistory } from '../services/adjustmentService';

export default function useAdjustmentHistory() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentHistoryEntry[]>([]);

  const fetchAdjustmentHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const history = await getAdjustmentHistory();
      setAdjustmentHistory(history);
    } catch (err) {
      console.error('Error fetching adjustment history:', err);
      setError('Failed to load adjustment history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load history on mount
  useEffect(() => {
    fetchAdjustmentHistory();
  }, []);

  return {
    isLoading,
    error,
    adjustmentHistory,
    refreshHistory: fetchAdjustmentHistory
  };
}
