'use client';

import {
  Adjustment,
  AdjustmentHistoryEntry,
  ForecastSeries
} from '@/app/types/demand-planning';

// Mock user for demo purposes
const CURRENT_USER = 'demo.user';

// Mock adjustment history data
const mockAdjustmentHistory: AdjustmentHistoryEntry[] = [
  {
    id: 'adj-001',
    timePeriods: ['Q2-2025', 'Q3-2025'],
    type: 'percentage',
    value: 5,
    reason: 'marketing-campaign',
    notes: 'Summer promotion expected to increase demand',
    createdBy: 'john.doe',
    createdAt: '2025-01-15T10:30:00Z',
    appliedToForecasts: ['forecast-001'],
    impact: {
      beforeTotal: 10500,
      afterTotal: 11025,
      absoluteChange: 525,
      percentageChange: 5
    }
  },
  {
    id: 'adj-002',
    timePeriods: ['Q4-2025'],
    type: 'percentage',
    value: -3,
    reason: 'economic-trends',
    notes: 'Economic downturn expected to impact holiday sales',
    createdBy: 'jane.smith',
    createdAt: '2025-01-20T14:45:00Z',
    appliedToForecasts: ['forecast-001'],
    impact: {
      beforeTotal: 8000,
      afterTotal: 7760,
      absoluteChange: -240,
      percentageChange: -3
    }
  },
  {
    id: 'adj-003',
    timePeriods: ['Q1-2025', 'Q2-2025'],
    type: 'absolute',
    value: 1000,
    reason: 'supply-chain',
    notes: 'Additional inventory becoming available',
    createdBy: 'bob.johnson',
    createdAt: '2025-01-22T09:15:00Z',
    appliedToForecasts: ['forecast-001'],
    impact: {
      beforeTotal: 12000,
      afterTotal: 13000,
      absoluteChange: 1000,
      percentageChange: 8.33
    }
  },
  {
    id: 'adj-004',
    timePeriods: ['Q2-2025'],
    type: 'percentage',
    value: 12,
    reason: 'marketing-campaign',
    notes: 'Increased budget for promotional activities',
    createdBy: 'sarah.lee',
    createdAt: '2025-01-25T16:30:00Z',
    appliedToForecasts: ['forecast-001'],
    impact: {
      beforeTotal: 7500,
      afterTotal: 8400,
      absoluteChange: 900,
      percentageChange: 12
    }
  },
  {
    id: 'adj-005',
    timePeriods: ['Q3-2025'],
    type: 'percentage',
    value: -8,
    reason: 'competitive-activity',
    notes: 'Competitor opening new location nearby',
    createdBy: 'john.doe',
    createdAt: '2025-01-28T11:00:00Z',
    appliedToForecasts: ['forecast-001'],
    impact: {
      beforeTotal: 9000,
      afterTotal: 8280,
      absoluteChange: -720,
      percentageChange: -8
    }
  }
];

// Get adjustment history
export async function getAdjustmentHistory(): Promise<AdjustmentHistoryEntry[]> {
  // In a real implementation, this would fetch from an API
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

  return [...mockAdjustmentHistory];
}

// Create a new adjustment
export async function createAdjustment(
  adjustment: Omit<Adjustment, 'id' | 'createdBy' | 'createdAt' | 'appliedToForecasts'>,
  forecastData: ForecastSeries
): Promise<AdjustmentHistoryEntry> {
  // In a real implementation, this would send to an API
  await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API delay

  // Calculate baseline total for selected time periods
  const baselineTotal = forecastData.baseline
    .filter(point => adjustment.timePeriods.includes(point.periodId))
    .reduce((sum, point) => sum + point.value, 0);

  // Calculate adjusted total
  const adjustedTotal = adjustment.type === 'percentage'
    ? baselineTotal * (1 + adjustment.value / 100)
    : baselineTotal + adjustment.value;

  // Create a new adjustment entry
  const newAdjustment: AdjustmentHistoryEntry = {
    id: `adj-${Date.now()}`,
    ...adjustment,
    createdBy: CURRENT_USER,
    createdAt: new Date().toISOString(),
    appliedToForecasts: [forecastData.id],
    impact: {
      beforeTotal: baselineTotal,
      afterTotal: adjustedTotal,
      absoluteChange: adjustedTotal - baselineTotal,
      percentageChange: ((adjustedTotal / baselineTotal) - 1) * 100
    }
  };

  // Add to mock history (in a real implementation, this would be saved to a backend)
  mockAdjustmentHistory.unshift(newAdjustment);

  return newAdjustment;
}
