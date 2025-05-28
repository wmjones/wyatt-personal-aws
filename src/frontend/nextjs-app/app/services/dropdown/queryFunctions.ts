/**
 * Query functions for dropdown data fetching
 * These functions handle the actual API calls for dropdown options
 */

import { forecastService } from '@/app/services/forecastService';

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Transform raw string arrays to dropdown options
 */
function transformToDropdownOptions(items: string[], labelPrefix?: string): DropdownOption[] {
  return items.map(item => ({
    value: item,
    label: labelPrefix ? `${labelPrefix} ${item}` : item
  }));
}

/**
 * Fetch state options
 */
export async function fetchStateOptions(): Promise<DropdownOption[]> {
  const states = await forecastService.getDistinctStates();
  return transformToDropdownOptions(states);
}

/**
 * Fetch DMA options (optionally filtered by state)
 */
export async function fetchDMAOptions(/* filters?: { stateId?: string } */): Promise<DropdownOption[]> {
  // For now, we fetch all DMAs as the service doesn't support filtering yet
  // TODO: Add server-side filtering support when available
  const dmas = await forecastService.getDistinctDmaIds();
  return transformToDropdownOptions(dmas, 'DMA');
}

/**
 * Fetch DC options (optionally filtered by state or DMA)
 */
export async function fetchDCOptions(/* filters?: { stateId?: string; dmaId?: string } */): Promise<DropdownOption[]> {
  // For now, we fetch all DCs as the service doesn't support filtering yet
  // TODO: Add server-side filtering support when available
  const dcs = await forecastService.getDistinctDcIds();
  return transformToDropdownOptions(dcs, 'DC');
}

/**
 * Fetch inventory item options
 */
export async function fetchInventoryItemOptions(): Promise<DropdownOption[]> {
  const items = await forecastService.getDistinctInventoryItems();
  return items.map(item => ({
    value: String(item),
    label: `Item ${item}`
  }));
}

/**
 * Fetch restaurant options
 */
export async function fetchRestaurantOptions(): Promise<DropdownOption[]> {
  const restaurants = await forecastService.getDistinctRestaurants();
  return restaurants.map(restaurant => ({
    value: String(restaurant),
    label: `Restaurant ${restaurant}`
  }));
}
