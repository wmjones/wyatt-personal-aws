/**
 * TanStack Query hooks for dropdown options
 * Provides automatic deduplication, caching, and state management for dropdown data
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { dropdownKeys } from '@/app/services/dropdown/queryKeys';
import {
  fetchStateOptions,
  fetchDMAOptions,
  fetchDCOptions,
  fetchInventoryItemOptions,
  fetchRestaurantOptions,
  DropdownOption
} from '@/app/services/dropdown/queryFunctions';

// Common options for dropdown queries
const DROPDOWN_QUERY_OPTIONS = {
  staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
  gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

/**
 * Hook to fetch state options
 */
export function useStateOptions(
  options?: Omit<UseQueryOptions<DropdownOption[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dropdownKeys.states(),
    queryFn: fetchStateOptions,
    ...DROPDOWN_QUERY_OPTIONS,
    ...options,
  });
}

/**
 * Hook to fetch DMA options
 */
export function useDMAOptions(
  filters?: { stateId?: string },
  options?: Omit<UseQueryOptions<DropdownOption[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dropdownKeys.dmas(filters),
    queryFn: () => fetchDMAOptions(),
    ...DROPDOWN_QUERY_OPTIONS,
    ...options,
  });
}

/**
 * Hook to fetch DC options
 */
export function useDCOptions(
  filters?: { stateId?: string; dmaId?: string },
  options?: Omit<UseQueryOptions<DropdownOption[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dropdownKeys.dcs(filters),
    queryFn: () => fetchDCOptions(),
    ...DROPDOWN_QUERY_OPTIONS,
    ...options,
  });
}

/**
 * Hook to fetch inventory item options
 */
export function useInventoryItemOptions(
  options?: Omit<UseQueryOptions<DropdownOption[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dropdownKeys.inventoryItems(),
    queryFn: fetchInventoryItemOptions,
    ...DROPDOWN_QUERY_OPTIONS,
    ...options,
  });
}

/**
 * Hook to fetch restaurant options
 */
export function useRestaurantOptions(
  options?: Omit<UseQueryOptions<DropdownOption[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dropdownKeys.restaurants(),
    queryFn: fetchRestaurantOptions,
    ...DROPDOWN_QUERY_OPTIONS,
    ...options,
  });
}

/**
 * Hook to prefetch all dropdown options
 * Useful for preloading data on page load
 */
export function usePrefetchDropdownOptions() {
  const stateQuery = useStateOptions();
  const dmaQuery = useDMAOptions();
  const dcQuery = useDCOptions();
  const inventoryQuery = useInventoryItemOptions();

  return {
    isLoading: stateQuery.isLoading || dmaQuery.isLoading || dcQuery.isLoading || inventoryQuery.isLoading,
    isError: stateQuery.isError || dmaQuery.isError || dcQuery.isError || inventoryQuery.isError,
    error: stateQuery.error || dmaQuery.error || dcQuery.error || inventoryQuery.error,
  };
}
