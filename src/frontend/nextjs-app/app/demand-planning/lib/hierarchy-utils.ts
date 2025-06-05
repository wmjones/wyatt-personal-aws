/**
 * Utility functions for hierarchical filter validation
 * Maps states to their available DMAs and DCs based on forecast data
 */

import { PostgresForecastData } from '@/app/services/postgresForecastService';

export interface HierarchicalMapping {
  states: string[];
  stateToDMAs: Record<string, string[]>;
  stateToDCs: Record<string, string[]>;
  dmaToStates: Record<string, string[]>;
  dcToStates: Record<string, string[]>;
}

/**
 * Build hierarchical mapping from forecast data
 */
export function buildHierarchicalMapping(forecastData: PostgresForecastData[]): HierarchicalMapping {
  const states = new Set<string>();
  const stateToDMAs: Record<string, Set<string>> = {};
  const stateToDCs: Record<string, Set<string>> = {};
  const dmaToStates: Record<string, Set<string>> = {};
  const dcToStates: Record<string, Set<string>> = {};

  // Process each data point to build mappings
  forecastData.forEach(point => {
    if (point.state) {
      states.add(point.state);

      // Initialize sets if not exists
      if (!stateToDMAs[point.state]) {
        stateToDMAs[point.state] = new Set();
      }
      if (!stateToDCs[point.state]) {
        stateToDCs[point.state] = new Set();
      }

      // Map DMAs
      if (point.dma_id) {
        stateToDMAs[point.state].add(point.dma_id);

        if (!dmaToStates[point.dma_id]) {
          dmaToStates[point.dma_id] = new Set();
        }
        dmaToStates[point.dma_id].add(point.state);
      }

      // Map DCs
      if (point.dc_id) {
        const dcIdStr = String(point.dc_id);
        stateToDCs[point.state].add(dcIdStr);

        if (!dcToStates[dcIdStr]) {
          dcToStates[dcIdStr] = new Set();
        }
        dcToStates[dcIdStr].add(point.state);
      }
    }
  });

  // Convert sets to arrays
  return {
    states: Array.from(states).sort(),
    stateToDMAs: Object.fromEntries(
      Object.entries(stateToDMAs).map(([state, dmasSet]) => [state, Array.from(dmasSet).sort()])
    ),
    stateToDCs: Object.fromEntries(
      Object.entries(stateToDCs).map(([state, dcsSet]) => [state, Array.from(dcsSet).sort()])
    ),
    dmaToStates: Object.fromEntries(
      Object.entries(dmaToStates).map(([dma, statesSet]) => [dma, Array.from(statesSet).sort()])
    ),
    dcToStates: Object.fromEntries(
      Object.entries(dcToStates).map(([dc, statesSet]) => [dc, Array.from(statesSet).sort()])
    )
  };
}

/**
 * Get available DMAs for selected states
 */
export function getAvailableDMAs(
  mapping: HierarchicalMapping,
  selectedStates: string[]
): string[] {
  if (selectedStates.length === 0) {
    return Object.keys(mapping.dmaToStates);
  }

  const availableDMAs = new Set<string>();
  selectedStates.forEach(state => {
    const dmas = mapping.stateToDMAs[state] || [];
    dmas.forEach(dma => availableDMAs.add(dma));
  });

  return Array.from(availableDMAs).sort();
}

/**
 * Get available DCs for selected states
 */
export function getAvailableDCs(
  mapping: HierarchicalMapping,
  selectedStates: string[]
): string[] {
  if (selectedStates.length === 0) {
    return Object.keys(mapping.dcToStates);
  }

  const availableDCs = new Set<string>();
  selectedStates.forEach(state => {
    const dcs = mapping.stateToDCs[state] || [];
    dcs.forEach(dc => availableDCs.add(dc));
  });

  return Array.from(availableDCs).sort();
}

/**
 * Check if a DMA is available for selected states
 */
export function isDMAAvailable(
  mapping: HierarchicalMapping,
  dmaId: string,
  selectedStates: string[]
): boolean {
  if (selectedStates.length === 0) return true;

  const dmaStates = mapping.dmaToStates[dmaId] || [];
  return selectedStates.some(state => dmaStates.includes(state));
}

/**
 * Check if a DC is available for selected states
 */
export function isDCAvailable(
  mapping: HierarchicalMapping,
  dcId: string,
  selectedStates: string[]
): boolean {
  if (selectedStates.length === 0) return true;

  const dcStates = mapping.dcToStates[dcId] || [];
  return selectedStates.some(state => dcStates.includes(state));
}
