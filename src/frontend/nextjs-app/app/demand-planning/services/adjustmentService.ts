'use client';

import {
  Adjustment,
  AdjustmentHistoryEntry,
  ForecastSeries
} from '@/app/types/demand-planning';
import { authService } from '@/app/services/auth';

/**
 * Get authorization header for API requests
 */
async function getAuthHeader(): Promise<HeadersInit> {
  // Get the ID token from the auth service
  const token = await authService.getIdToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Get adjustment history from the API
 */
export async function getAdjustmentHistory(forecastId?: string): Promise<AdjustmentHistoryEntry[]> {
  try {
    const headers = await getAuthHeader();
    const queryParams = new URLSearchParams();
    if (forecastId) {
      queryParams.append('forecast_id', forecastId);
    }

    const response = await fetch(`/api/adjustments?${queryParams}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch adjustments: ${response.statusText}`);
    }

    const adjustments = await response.json();
    return adjustments;
  } catch (error) {
    console.error('Error fetching adjustment history:', error);
    throw error;
  }
}

/**
 * Create a new adjustment
 */
export async function createAdjustment(
  adjustment: Omit<Adjustment, 'id' | 'createdBy' | 'createdAt' | 'appliedToForecasts'>,
  forecastData: ForecastSeries
): Promise<AdjustmentHistoryEntry> {
  try {
    // Calculate baseline total for selected time periods
    const baselineTotal = forecastData.baseline
      .filter(point => adjustment.timePeriods.includes(point.periodId))
      .reduce((sum, point) => sum + point.value, 0);

    // Calculate adjusted total
    const adjustedTotal = adjustment.type === 'percentage'
      ? baselineTotal * (1 + adjustment.value / 100)
      : baselineTotal + adjustment.value;

    const headers = await getAuthHeader();

    const response = await fetch('/api/adjustments', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        forecastId: forecastData.id,
        timePeriods: adjustment.timePeriods,
        type: adjustment.type,
        value: adjustment.value,
        reason: adjustment.reason,
        notes: adjustment.notes,
        impact: {
          beforeTotal: baselineTotal,
          afterTotal: adjustedTotal,
          absoluteChange: adjustedTotal - baselineTotal,
          percentageChange: ((adjustedTotal / baselineTotal) - 1) * 100
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create adjustment: ${response.statusText}`);
    }

    const newAdjustment = await response.json();
    return newAdjustment;
  } catch (error) {
    console.error('Error creating adjustment:', error);
    throw error;
  }
}

/**
 * Update an adjustment (e.g., toggle active state)
 */
export async function updateAdjustment(id: string, updates: { isActive?: boolean }): Promise<AdjustmentHistoryEntry> {
  try {
    const headers = await getAuthHeader();

    const response = await fetch('/api/adjustments', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        id,
        ...updates
      })
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You can only edit your own adjustments');
      }
      throw new Error(`Failed to update adjustment: ${response.statusText}`);
    }

    const updatedAdjustment = await response.json();
    return updatedAdjustment;
  } catch (error) {
    console.error('Error updating adjustment:', error);
    throw error;
  }
}

/**
 * Delete an adjustment
 */
export async function deleteAdjustment(id: string): Promise<void> {
  try {
    const headers = await getAuthHeader();

    const response = await fetch(`/api/adjustments?id=${id}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You can only delete your own adjustments');
      }
      throw new Error(`Failed to delete adjustment: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting adjustment:', error);
    throw error;
  }
}
