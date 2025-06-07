/**
 * Hook to manage hierarchical mapping of states, DMAs, and DCs
 * Provides filtered options based on selected states
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postgresForecastService } from '@/app/services/postgresForecastService';
import { buildHierarchicalMapping, HierarchicalMapping } from '../lib/hierarchy-utils';

const MAPPING_QUERY_KEY = ['hierarchical-mapping'];

/**
 * Fetch all forecast data points to build hierarchical mapping
 * This is cached and shared across all components
 */
async function fetchHierarchicalData(): Promise<HierarchicalMapping> {
  // Fetch a sample of data to build the mapping
  // We only need unique combinations, not all data points
  const data = await postgresForecastService.getForecastData({
    // Fetch data for mapping (limited to reduce payload)
    limit: 10000
  });

  return buildHierarchicalMapping(data);
}

/**
 * Hook to get hierarchical mapping data
 */
export function useHierarchicalMapping() {
  const { data: mapping, isLoading, error } = useQuery({
    queryKey: MAPPING_QUERY_KEY,
    queryFn: fetchHierarchicalData,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });

  return {
    mapping: mapping || {
      states: [],
      stateToDMAs: {},
      stateToDCs: {},
      dmaToStates: {},
      dcToStates: {}
    },
    isLoading,
    error
  };
}

/**
 * Hook to get filtered options based on selected states
 */
export function useFilteredOptions(selectedStates: string[]) {
  const { mapping, isLoading } = useHierarchicalMapping();

  const filteredOptions = useMemo(() => {
    if (!mapping || isLoading) {
      return {
        availableDMAs: [],
        availableDCs: [],
        isDMAAvailable: () => true,
        isDCAvailable: () => true
      };
    }

    // Get available options based on selected states
    const availableDMAs = selectedStates.length === 0
      ? Object.keys(mapping.dmaToStates)
      : Array.from(new Set(
          selectedStates.flatMap(state => mapping.stateToDMAs[state] || [])
        )).sort();

    const availableDCs = selectedStates.length === 0
      ? Object.keys(mapping.dcToStates)
      : Array.from(new Set(
          selectedStates.flatMap(state => mapping.stateToDCs[state] || [])
        )).sort();

    return {
      availableDMAs,
      availableDCs,
      isDMAAvailable: (dmaId: string) => {
        if (selectedStates.length === 0) return true;
        const dmaStates = mapping.dmaToStates[dmaId] || [];
        return selectedStates.some(state => dmaStates.includes(state));
      },
      isDCAvailable: (dcId: string) => {
        if (selectedStates.length === 0) return true;
        const dcStates = mapping.dcToStates[dcId] || [];
        return selectedStates.some(state => dcStates.includes(state));
      }
    };
  }, [mapping, selectedStates, isLoading]);

  return {
    ...filteredOptions,
    isLoading
  };
}
